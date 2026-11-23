import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "../test/integration-app.js";

describe.skipIf(!integrationDatabaseUrl)("quotes v2", () => {
  let ctx: IntegrationApp;

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  it("quote stores productSlug, students and organization type", async () => {
    const organization = `Trường THCS ${uniqueSuffix()}`;
    const response = await fetch(`${ctx.baseUrl}/quotes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organization, contactName: "Cô Lan", phone: "0900000001", email: "lan@truong.edu.vn",
        quantity: 1, productSlug: "combo-lop-hoc-quoc-te", students: 20, organizationType: "school",
        requirements: "Lớp quốc tế, cần giáo trình tiếng Anh",
      }),
    });
    expect(response.status).toBe(201);
    const [row] = await ctx.dataSource.query(`SELECT "productSlug", students, "organizationType" FROM quote_requests WHERE organization = $1`, [organization]);
    expect(row).toEqual({ productSlug: "combo-lop-hoc-quoc-te", students: 20, organizationType: "school" });
  });

  it("rejects an unknown organization type", async () => {
    const response = await fetch(`${ctx.baseUrl}/quotes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organization: "X", contactName: "Y", phone: "0900000001", quantity: 1, organizationType: "alien" }),
    });
    expect(response.status).toBe(400);
  });
});
