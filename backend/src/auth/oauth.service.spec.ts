import { createHash } from "node:crypto";
import { BadRequestException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OauthTicket } from "./entities/oauth-ticket.entity";
import { User, UserRole } from "./entities/user.entity";
import { OauthService } from "./oauth.service";

const ENV = {
  FRONTEND_URL: "https://www.droneviet.vn",
  GOOGLE_CLIENT_ID: "google-client",
  GOOGLE_CLIENT_SECRET: "google-secret",
  PUBLIC_API_URL: "https://api.droneviet.vn",
  ZALO_APP_ID: "zalo-app",
  ZALO_APP_SECRET: "zalo-secret",
};

/** Minimal in-memory stand-in for a TypeORM repository keyed by `key`. */
function memoryRepo<T extends object>(key: keyof T) {
  const rows = new Map<unknown, T>();
  let seq = 0;
  return {
    rows,
    create: (value: Partial<T>) => ({ ...value }) as T,
    save: async (value: T) => {
      const row = { ...value } as T & { id?: string };
      if ("id" in row || key === ("id" as keyof T)) row.id ??= `id-${++seq}`;
      rows.set(row[key], row);
      return row;
    },
    findOneBy: async (where: Partial<T>) =>
      [...rows.values()].find((row) =>
        Object.entries(where).every(([k, v]) => (row as Record<string, unknown>)[k] === v),
      ) ?? null,
    delete: async (where: Partial<T>) => {
      for (const [k, row] of rows) {
        if (Object.entries(where).every(([f, v]) => (row as Record<string, unknown>)[f] === v)) {
          rows.delete(k);
        }
      }
    },
  };
}

function setup(env: Record<string, string> = ENV) {
  const users = memoryRepo<User>("id");
  const tickets = memoryRepo<OauthTicket>("id");
  const auth = {
    issueSession: vi.fn(async (user: User) => ({ accessToken: `token-for-${user.id}`, user })),
  };
  const config = { get: (k: string) => env[k as keyof typeof env] };
  const service = new OauthService(users as never, tickets as never, auth as never, config as never);
  return { service, users, tickets, auth };
}

function stubFetch(responses: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const match = Object.keys(responses).find((prefix) => String(url).startsWith(prefix));
    if (!match) throw new Error(`unexpected fetch ${url}`);
    return { ok: true, json: async () => responses[match] };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OauthService", () => {
  it("reports only providers whose credentials are configured", () => {
    expect(setup().service.providers()).toEqual({ google: true, zalo: true });
    expect(setup({ ...ENV, GOOGLE_CLIENT_SECRET: "", ZALO_APP_ID: "" }).service.providers()).toEqual({
      google: false,
      zalo: false,
    });
  });

  it("builds a Google consent URL with the API callback and a stored single-use state", async () => {
    const { service, tickets } = setup();

    const url = new URL(await service.startGoogle());

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("google-client");
    expect(url.searchParams.get("redirect_uri")).toBe("https://api.droneviet.vn/auth/google/callback");
    const state = url.searchParams.get("state");
    expect(state).toBeTruthy();
    expect([...tickets.rows.values()]).toEqual([
      expect.objectContaining({ kind: "state", provider: "google", token: state }),
    ]);
  });

  it("refuses to start a provider that is not configured", async () => {
    await expect(setup({ ...ENV, GOOGLE_CLIENT_ID: "" }).service.startGoogle()).rejects.toThrow(
      BadRequestException,
    );
  });

  it("creates a customer from a Google profile and hands back a single-use exchange code", async () => {
    const { service, users } = setup();
    const state = new URL(await service.startGoogle()).searchParams.get("state")!;
    stubFetch({
      "https://oauth2.googleapis.com/token": { access_token: "g-access" },
      "https://www.googleapis.com/oauth2/v2/userinfo": { id: "g-1", email: "An@Example.com", name: "An" },
    });

    const exchangeCode = await service.finishGoogle("auth-code", state);
    const session = await service.exchange(exchangeCode);

    const user = [...users.rows.values()][0];
    expect(user).toMatchObject({ email: "an@example.com", googleId: "g-1", passwordHash: null, roles: [UserRole.CUSTOMER] });
    expect(session).toEqual({ accessToken: `token-for-${user.id}`, user });
    await expect(service.exchange(exchangeCode)).rejects.toThrow(BadRequestException);
  });

  it("links Google to an existing email account instead of duplicating it", async () => {
    const { service, users } = setup();
    await users.save({ email: "an@example.com", passwordHash: "hash", roles: [UserRole.CUSTOMER] } as User);
    const state = new URL(await service.startGoogle()).searchParams.get("state")!;
    stubFetch({
      "https://oauth2.googleapis.com/token": { access_token: "g-access" },
      "https://www.googleapis.com/oauth2/v2/userinfo": { id: "g-1", email: "an@example.com", name: "An" },
    });

    await service.finishGoogle("auth-code", state);

    expect(users.rows.size).toBe(1);
    expect([...users.rows.values()][0]).toMatchObject({ googleId: "g-1", passwordHash: "hash" });
  });

  it("rejects a callback whose state was never issued or was already used", async () => {
    const { service } = setup();
    const state = new URL(await service.startGoogle()).searchParams.get("state")!;
    stubFetch({
      "https://oauth2.googleapis.com/token": { access_token: "g-access" },
      "https://www.googleapis.com/oauth2/v2/userinfo": { id: "g-1", email: "an@example.com" },
    });

    await expect(service.finishGoogle("auth-code", "forged")).rejects.toThrow(BadRequestException);
    await service.finishGoogle("auth-code", state);
    await expect(service.finishGoogle("auth-code", state)).rejects.toThrow(BadRequestException);
  });

  it("starts Zalo with an S256 PKCE challenge and finishes with the matching verifier", async () => {
    const { service, tickets, users } = setup();
    const url = new URL(await service.startZalo());
    const state = url.searchParams.get("state")!;
    const ticket = [...tickets.rows.values()].find((t) => t.token === state)!;
    expect(url.origin + url.pathname).toBe("https://oauth.zaloapp.com/v4/permission");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBe(
      createHash("sha256").update(ticket.codeVerifier!).digest("base64url"),
    );
    const fetchMock = stubFetch({
      "https://oauth.zaloapp.com/v4/access_token": { access_token: "z-access" },
      "https://graph.zalo.me/v2.0/me": { id: "z-9", name: "Bình" },
    });

    await service.exchange(await service.finishZalo("auth-code", state));

    const tokenBody = String((fetchMock.mock.calls[0][1] as RequestInit).body);
    expect(tokenBody).toContain(`code_verifier=${ticket.codeVerifier}`);
    expect([...users.rows.values()][0]).toMatchObject({
      displayName: "Bình",
      email: "zalo_z-9@users.droneviet.vn",
      zaloId: "z-9",
    });
  });

  it("rejects an expired exchange code", async () => {
    const { service, tickets } = setup();
    await tickets.save({
      expiresAt: new Date(Date.now() - 1000),
      kind: "exchange",
      provider: "google",
      token: "stale",
      userId: "u-1",
    } as OauthTicket);

    await expect(service.exchange("stale")).rejects.toThrow(BadRequestException);
  });
});
