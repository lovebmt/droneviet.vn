import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, createUserToken, integrationDatabaseUrl, type IntegrationApp } from "../test/integration-app.js";

describe.skipIf(!integrationDatabaseUrl)("site settings", () => {
  let ctx: IntegrationApp;
  let admin: string;
  let customer: string;

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    await ctx.dataSource.query(`DELETE FROM site_settings`);
    admin = await createUserToken(ctx, ["super_admin"]);
    customer = await createUserToken(ctx);
  }, 60_000);

  afterAll(async () => {
    await ctx?.dataSource.query(`DELETE FROM site_settings`);
    await ctx?.close();
  });

  const patch = (token: string, body: unknown) =>
    fetch(`${ctx.baseUrl}/admin/settings/contact`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

  it("public settings fall back to defaults", async () => {
    expect(await (await fetch(`${ctx.baseUrl}/settings/public`)).json()).toEqual({
      contact: { zalo: "0384070636", phone: null, email: null, address: null, companyName: null },
      announcement: null,
    });
  });

  it("admin updates contact and public reflects it; customers cannot", async () => {
    expect((await patch(customer, { value: { email: "x@y.z" } })).status).toBe(403);
    expect((await patch(admin, { value: { email: "lienhe@droneviet.vn", phone: "0900000000" } })).status).toBe(200);
    const settings = await (await fetch(`${ctx.baseUrl}/settings/public`)).json();
    expect(settings.contact).toEqual({ zalo: "0384070636", phone: "0900000000", email: "lienhe@droneviet.vn", address: null, companyName: null });
  });

  it("rejects unknown setting keys", async () => {
    const response = await fetch(`${ctx.baseUrl}/admin/settings/secret-stuff`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${admin}` },
      body: JSON.stringify({ value: { a: 1 } }),
    });
    expect(response.status).toBe(400);
  });
});
