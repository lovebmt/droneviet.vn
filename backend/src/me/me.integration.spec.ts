import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, createUserToken, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "../test/integration-app.js";

describe.skipIf(!integrationDatabaseUrl)("my orders and courses", () => {
  let ctx: IntegrationApp;
  let alice: string;
  let bob: string;
  let variantId: string;
  const s = uniqueSuffix();

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    alice = await createUserToken(ctx);
    bob = await createUserToken(ctx);
    const [p] = await ctx.dataSource.query(`INSERT INTO products (slug,name,summary,kind,status) VALUES ($1,'Drone Me','s','drone','published') RETURNING id`, [`me-${s}`]);
    const [v] = await ctx.dataSource.query(`INSERT INTO product_variants ("productId",sku,title,"priceVnd","purchaseMode","isActive") VALUES ($1,$2,'Tiêu chuẩn',500000,'checkout',true) RETURNING id`, [p.id, `ME-${s}`]);
    variantId = v.id;
    await ctx.dataSource.query(`INSERT INTO inventory_items ("productVariantId","onHand",reserved) VALUES ($1,50,0)`, [variantId]);
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  async function order(token?: string, lines = [{ variantId, quantity: 1 }]) {
    const response = await fetch(`${ctx.baseUrl}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ contactName: "Khách", contactPhone: "0900000099", paymentMethod: "cod", shippingAddress: "HCM", lines }),
    });
    return response;
  }
  const me = (path: string, token: string) => fetch(`${ctx.baseUrl}/me${path}`, { headers: { authorization: `Bearer ${token}` } });

  it("order created while signed in appears in /me/orders", async () => {
    const created = await (await order(alice)).json();
    const mine = (await (await me("/orders", alice)).json()) as Array<{ orderNumber: string; lines: Array<{ title: string; quantity: number }> }>;
    expect(mine.map((o) => o.orderNumber)).toContain(created.order.orderNumber);
    expect(mine.find((o) => o.orderNumber === created.order.orderNumber)?.lines).toEqual([
      expect.objectContaining({ title: "Drone Me - Tiêu chuẩn", quantity: 1, subtotalVnd: 500_000 }),
    ]);
    expect((await me(`/orders/${created.order.orderNumber}`, alice)).status).toBe(200);
  });

  it("guest order is not listed for anyone", async () => {
    const guest = await (await order()).json();
    for (const token of [alice, bob]) {
      const mine = (await (await me("/orders", token)).json()) as Array<{ orderNumber: string }>;
      expect(mine.map((o) => o.orderNumber)).not.toContain(guest.order.orderNumber);
    }
  });

  it("another user's order number is 404", async () => {
    const created = await (await order(alice)).json();
    expect((await me(`/orders/${created.order.orderNumber}`, bob)).status).toBe(404);
  });

  it("my courses is empty for a new account and requires a session", async () => {
    expect(await (await me("/courses", bob)).json()).toEqual([]);
    expect((await fetch(`${ctx.baseUrl}/me/courses`)).status).toBe(401);
  });

  it("lookup without phone is 400", async () => {
    const created = await (await order()).json();
    expect((await fetch(`${ctx.baseUrl}/orders/${created.order.orderNumber}`)).status).toBe(400);
  });

  it("empty variantId is 400", async () => {
    expect((await order(undefined, [{ variantId: "", quantity: 1 }])).status).toBe(400);
  });
});
