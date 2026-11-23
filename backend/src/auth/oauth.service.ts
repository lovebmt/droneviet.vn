import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes } from "node:crypto";
import { Repository } from "typeorm";
import { AuthService } from "./auth.service";
import { OauthProvider, OauthTicket } from "./entities/oauth-ticket.entity";
import { User, UserRole } from "./entities/user.entity";

export type OauthFailureReason =
  | "config"
  | "denied"
  | "profile"
  | "state"
  | "token_exchange"
  | "unknown";

/** A sign-in failure that names the step that broke; the web shows `reason` as an error code. */
export class OauthFailure extends BadRequestException {
  constructor(
    readonly reason: OauthFailureReason,
    message: string,
    /** Short, sanitised summary of what the provider answered; safe to show on the login page. */
    readonly detail?: string,
  ) {
    super({ message, reason });
  }
}

const VERIFIER_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Zalo's PKCE rule (user-access-token-v4, step 2): a code_verifier of exactly 43 characters
 * containing upper case, lower case and digits. base64url would also allow "-" and "_".
 */
function zaloCodeVerifier(): string {
  for (;;) {
    let verifier = "";
    while (verifier.length < 43) {
      for (const byte of randomBytes(64)) {
        // 248 = 62 * 4: rejecting larger bytes keeps every character equally likely.
        if (byte < 248 && verifier.length < 43) {
          verifier += VERIFIER_ALPHABET[byte % 62];
        }
      }
    }
    if (/[A-Z]/.test(verifier) && /[a-z]/.test(verifier) && /\d/.test(verifier)) {
      return verifier;
    }
  }
}

const STATE_TTL_MS = 10 * 60 * 1000;
const EXCHANGE_TTL_MS = 60 * 1000;

interface OauthProfile {
  displayName?: string;
  email: string;
  providerId: string;
}

/** Google + Zalo sign-in, ported from we3d's identity-service. */
@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(OauthTicket) private readonly tickets: Repository<OauthTicket>,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  providers(): Record<OauthProvider, boolean> {
    return {
      google: Boolean(this.env("GOOGLE_CLIENT_ID") && this.env("GOOGLE_CLIENT_SECRET")),
      zalo: Boolean(this.env("ZALO_APP_ID") && this.env("ZALO_APP_SECRET")),
    };
  }

  frontendUrl(): string {
    return (this.env("FRONTEND_URL") || "http://localhost:3000").replace(/\/$/, "");
  }

  callbackUrl(provider: OauthProvider): string {
    // Zalo only accepts callbacks on a verified domain (www.droneviet.vn), which relays to the API.
    if (provider === "zalo" && this.env("ZALO_REDIRECT_URI")) {
      return this.env("ZALO_REDIRECT_URI");
    }
    const api = (this.env("PUBLIC_API_URL") || "http://localhost:4000").replace(/\/$/, "");
    return `${api}/auth/${provider}/callback`;
  }

  async startGoogle(): Promise<string> {
    this.assertConfigured("google");
    const state = await this.issueState("google", null);
    const params = new URLSearchParams({
      client_id: this.env("GOOGLE_CLIENT_ID"),
      prompt: "select_account",
      redirect_uri: this.callbackUrl("google"),
      response_type: "code",
      scope: "openid email profile",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async finishGoogle(code: string, state: string): Promise<string> {
    this.assertConfigured("google");
    await this.consumeState("google", state);

    const token = await this.postForm<{ access_token?: string }>("google token exchange", "https://oauth2.googleapis.com/token", {
      client_id: this.env("GOOGLE_CLIENT_ID"),
      client_secret: this.env("GOOGLE_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: this.callbackUrl("google"),
    });
    if (!token.access_token) {
      throw new OauthFailure("token_exchange", "Google token exchange failed", summariseProviderBody(token));
    }

    const profile = await this.getJson<{ id?: string; email?: string; name?: string }>(
      "google profile",
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { Authorization: `Bearer ${token.access_token}` },
    );
    if (!profile.id || !profile.email) {
      throw new OauthFailure("profile", "Google profile is missing an id or email", summariseProviderBody(profile));
    }

    const user = await this.upsertUser("googleId", {
      displayName: profile.name,
      email: profile.email,
      providerId: profile.id,
    });
    this.logger.log(`google signed in user=${user.id}`);
    return this.issueExchange("google", user.id);
  }

  async startZalo(): Promise<string> {
    this.assertConfigured("zalo");
    const codeVerifier = zaloCodeVerifier();
    const state = await this.issueState("zalo", codeVerifier);
    this.logger.log(
      `zalo start app_id=${this.env("ZALO_APP_ID")} redirect_uri=${this.callbackUrl("zalo")} verifier_length=${codeVerifier.length}`,
    );
    const params = new URLSearchParams({
      app_id: this.env("ZALO_APP_ID"),
      code_challenge: createHash("sha256").update(codeVerifier).digest("base64url"),
      code_challenge_method: "S256",
      redirect_uri: this.callbackUrl("zalo"),
      state,
    });
    return `https://oauth.zaloapp.com/v4/permission?${params}`;
  }

  async finishZalo(code: string, state: string): Promise<string> {
    this.assertConfigured("zalo");
    const ticket = await this.consumeState("zalo", state);

    const token = await this.postForm<{ access_token?: string }>(
      "zalo token exchange",
      "https://oauth.zaloapp.com/v4/access_token",
      {
        app_id: this.env("ZALO_APP_ID"),
        code,
        code_verifier: ticket.codeVerifier ?? "",
        grant_type: "authorization_code",
      },
      { secret_key: this.env("ZALO_APP_SECRET") },
    );
    if (!token.access_token) {
      throw new OauthFailure("token_exchange", "Zalo token exchange failed", summariseProviderBody(token));
    }

    const profile = await this.getJson<{ id?: string | number; name?: string }>(
      "zalo profile",
      "https://graph.zalo.me/v2.0/me?fields=id,name",
      { access_token: token.access_token },
    );
    if (!profile.id) {
      throw new OauthFailure("profile", "Zalo profile is missing an id", summariseProviderBody(profile));
    }

    const zaloId = String(profile.id);
    // Zalo gives no email; synthesise a stable, non-routable one.
    const user = await this.upsertUser("zaloId", {
      displayName: profile.name,
      email: `zalo_${zaloId}@users.droneviet.vn`,
      providerId: zaloId,
    });
    this.logger.log(`zalo signed in user=${user.id}`);
    return this.issueExchange("zalo", user.id);
  }

  /** Trade a one-time exchange code (from the callback redirect) for a session. */
  async exchange(code: string) {
    const ticket = await this.tickets.findOneBy({ kind: "exchange", token: code });
    if (ticket) {
      await this.tickets.delete({ id: ticket.id });
    }
    if (!ticket || !ticket.userId || ticket.expiresAt.getTime() < Date.now()) {
      this.logger.warn(`exchange rejected: ${ticket ? "expired" : "unknown code"}`);
      throw new BadRequestException("Sign-in link expired - please try again");
    }

    const user = await this.users.findOneBy({ id: ticket.userId });
    if (!user) {
      throw new BadRequestException("Account no longer exists");
    }
    return this.auth.issueSession(user);
  }

  private async upsertUser(field: "googleId" | "zaloId", profile: OauthProfile): Promise<User> {
    const linked = await this.users.findOneBy({ [field]: profile.providerId });
    if (linked) {
      return linked;
    }

    const email = profile.email.trim().toLowerCase();
    const existing = await this.users.findOneBy({ email });
    if (existing) {
      existing[field] = profile.providerId;
      existing.displayName ??= profile.displayName?.trim() || null;
      return this.users.save(existing);
    }

    return this.users.save(
      this.users.create({
        displayName: profile.displayName?.trim() || null,
        email,
        [field]: profile.providerId,
        passwordHash: null,
        roles: [UserRole.CUSTOMER],
      }),
    );
  }

  private async issueState(provider: OauthProvider, codeVerifier: string | null): Promise<string> {
    const token = randomBytes(24).toString("hex");
    await this.tickets.save(
      this.tickets.create({
        codeVerifier,
        expiresAt: new Date(Date.now() + STATE_TTL_MS),
        kind: "state",
        provider,
        token,
        userId: null,
      }),
    );
    return token;
  }

  /** Finding the state IS the CSRF check; deleting it makes a replayed callback fail. */
  private async consumeState(provider: OauthProvider, state: string): Promise<OauthTicket> {
    const ticket = state
      ? await this.tickets.findOneBy({ kind: "state", provider, token: state })
      : null;
    if (ticket) {
      await this.tickets.delete({ id: ticket.id });
    }
    if (!ticket || ticket.expiresAt.getTime() < Date.now()) {
      this.logger.warn(
        `${provider} state rejected: ${!state ? "missing" : ticket ? "expired" : "unknown or already used"}`,
      );
      throw new OauthFailure("state", "Sign-in session expired - please try again");
    }
    return ticket;
  }

  private async issueExchange(provider: OauthProvider, userId: string): Promise<string> {
    const token = randomBytes(24).toString("hex");
    await this.tickets.save(
      this.tickets.create({
        codeVerifier: null,
        expiresAt: new Date(Date.now() + EXCHANGE_TTL_MS),
        kind: "exchange",
        provider,
        token,
        userId,
      }),
    );
    return token;
  }

  private assertConfigured(provider: OauthProvider): void {
    if (!this.providers()[provider]) {
      this.logger.warn(`${provider} config missing: client id/secret not set`);
      throw new OauthFailure("config", `${provider} sign-in is not configured`);
    }
  }

  private env(key: string): string {
    return (this.config.get<string>(key) ?? "").trim();
  }

  private async postForm<T>(
    label: string,
    url: string,
    form: Record<string, string>,
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(url, {
      body: new URLSearchParams(form),
      headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
      method: "POST",
    });
    return this.readJson<T>(label, response);
  }

  private async getJson<T>(label: string, url: string, headers: Record<string, string>) {
    const response = await fetch(url, { headers });
    return this.readJson<T>(label, response);
  }

  /** Parses a provider response and logs its status plus only its error fields (never tokens or secrets). */
  private async readJson<T>(label: string, response: Response): Promise<T> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      this.logger.warn(`${label}: HTTP ${response.status} with a non-JSON body`);
      return {} as T;
    }

    const failure = describeProviderError(body);
    if (failure) {
      this.logger.warn(`${label}: HTTP ${response.status} ${failure}`);
    } else {
      this.logger.log(`${label}: HTTP ${response.status} ok`);
    }
    return body as T;
  }
}

const PROVIDER_ERROR_FIELDS = [
  "error",
  "error_name",
  "error_reason",
  "error_description",
  "error_uri",
  "message",
];

/** Returns the provider's error fields as JSON, or null when the body carries none. */
function describeProviderError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const record = body as Record<string, unknown>;
  const picked = Object.fromEntries(
    PROVIDER_ERROR_FIELDS.filter((key) => record[key] !== undefined).map((key) => [key, record[key]]),
  );
  return Object.keys(picked).length > 0 ? JSON.stringify(picked) : null;
}

/**
 * One short line describing a failed provider answer, e.g. "error -216 - Access token is invalid".
 * Built only from error fields (or key names), stripped of markup and capped at 80 characters,
 * so it can be shown on the login page without leaking tokens or allowing injection.
 */
function summariseProviderBody(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "non-object response";
  }

  const record = body as Record<string, unknown>;
  const parts: string[] = [];
  if (record.error !== undefined) {
    parts.push(`error ${String(record.error)}`);
  }
  const text = record.error_name ?? record.error_description ?? record.message;
  if (text !== undefined) {
    parts.push(String(text));
  }
  if (parts.length === 0) {
    parts.push(`no error field, keys: ${Object.keys(record).join(",") || "none"}`);
  }

  return parts.join(" - ").replace(/[^\w .,:=-]/g, "").slice(0, 80);
}
