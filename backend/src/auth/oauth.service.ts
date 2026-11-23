import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes } from "node:crypto";
import { Repository } from "typeorm";
import { AuthService } from "./auth.service";
import { OauthProvider, OauthTicket } from "./entities/oauth-ticket.entity";
import { User, UserRole } from "./entities/user.entity";

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

    const token = await this.postForm<{ access_token?: string }>("https://oauth2.googleapis.com/token", {
      client_id: this.env("GOOGLE_CLIENT_ID"),
      client_secret: this.env("GOOGLE_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: this.callbackUrl("google"),
    });
    if (!token.access_token) {
      throw new BadRequestException("Google token exchange failed");
    }

    const profile = await this.getJson<{ id?: string; email?: string; name?: string }>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { Authorization: `Bearer ${token.access_token}` },
    );
    if (!profile.id || !profile.email) {
      throw new BadRequestException("Google profile is missing an id or email");
    }

    const user = await this.upsertUser("googleId", {
      displayName: profile.name,
      email: profile.email,
      providerId: profile.id,
    });
    return this.issueExchange("google", user.id);
  }

  async startZalo(): Promise<string> {
    this.assertConfigured("zalo");
    const codeVerifier = randomBytes(32).toString("base64url");
    const state = await this.issueState("zalo", codeVerifier);
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
      throw new BadRequestException("Zalo token exchange failed");
    }

    const profile = await this.getJson<{ id?: string | number; name?: string }>(
      "https://graph.zalo.me/v2.0/me?fields=id,name",
      { access_token: token.access_token },
    );
    if (!profile.id) {
      throw new BadRequestException("Zalo profile is missing an id");
    }

    const zaloId = String(profile.id);
    // Zalo gives no email; synthesise a stable, non-routable one.
    const user = await this.upsertUser("zaloId", {
      displayName: profile.name,
      email: `zalo_${zaloId}@users.droneviet.vn`,
      providerId: zaloId,
    });
    return this.issueExchange("zalo", user.id);
  }

  /** Trade a one-time exchange code (from the callback redirect) for a session. */
  async exchange(code: string) {
    const ticket = await this.tickets.findOneBy({ kind: "exchange", token: code });
    if (ticket) {
      await this.tickets.delete({ id: ticket.id });
    }
    if (!ticket || !ticket.userId || ticket.expiresAt.getTime() < Date.now()) {
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
      throw new BadRequestException("Sign-in session expired - please try again");
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
      throw new BadRequestException(`${provider} sign-in is not configured`);
    }
  }

  private env(key: string): string {
    return (this.config.get<string>(key) ?? "").trim();
  }

  private async postForm<T>(url: string, form: Record<string, string>, headers: Record<string, string> = {}) {
    const response = await fetch(url, {
      body: new URLSearchParams(form),
      headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
      method: "POST",
    });
    return (await response.json()) as T;
  }

  private async getJson<T>(url: string, headers: Record<string, string>) {
    const response = await fetch(url, { headers });
    return (await response.json()) as T;
  }
}
