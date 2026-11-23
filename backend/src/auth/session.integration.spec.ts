import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "../test/integration-app.js";

describe.skipIf(!integrationDatabaseUrl)("cookie sessions", () => {
  let ctx: IntegrationApp;
  const email = `session-${uniqueSuffix()}@example.com`;
  const password = "Session-Password-123";

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    await fetch(`${ctx.baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: "Khách Hàng", email, password }),
    });
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  async function login(): Promise<string> {
    const response = await fetch(`${ctx.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(response.status).toBe(201);
    const setCookie = response.headers.getSetCookie().find((c) => c.startsWith("dv_session="));
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    return setCookie!.split(";")[0];
  }

  it("login sets dv_session and /auth/me reads it without an Authorization header", async () => {
    const cookie = await login();
    const me = await fetch(`${ctx.baseUrl}/auth/me`, { headers: { cookie } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ email, displayName: "Khách Hàng", roles: ["customer"] });
  });

  it("/auth/me without a session is 401", async () => {
    expect((await fetch(`${ctx.baseUrl}/auth/me`)).status).toBe(401);
  });

  it("logout clears the cookie", async () => {
    const cookie = await login();
    const logout = await fetch(`${ctx.baseUrl}/auth/logout`, { method: "POST", headers: { cookie } });
    expect(logout.status).toBe(201);
    const cleared = logout.headers.getSetCookie().find((c) => c.startsWith("dv_session="));
    expect(cleared).toMatch(/dv_session=;/);
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);
  });
});
