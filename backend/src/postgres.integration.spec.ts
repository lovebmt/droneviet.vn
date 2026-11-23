import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DataSource } from "typeorm";

// Runs only against a real Postgres: TEST_DATABASE_URL=postgres://droneviet:droneviet@localhost:5433/droneviet
const databaseUrl = process.env.TEST_DATABASE_URL;
const VARIANT_ID = "11111111-1111-4111-8111-111111111111";

describe.skipIf(!databaseUrl)("commerce API on postgres", () => {
  let app: INestApplication;
  let baseUrl: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_ACCESS_SECRET = "integration-access";
    process.env.JWT_REFRESH_SECRET = "integration-refresh";
    const { AppModule } = await import("./app.module.js");
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.listen(0);
    baseUrl = await app.getUrl();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
    // Start every run from a clean order/reservation state.
    await dataSource.query(
      "TRUNCATE order_lines, payment_attempts, course_enrollments, orders RESTART IDENTITY CASCADE",
    );
    await dataSource.query("UPDATE inventory_items SET reserved = 0");
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  async function reserved(): Promise<number> {
    const rows = await dataSource.query(
      'SELECT reserved FROM inventory_items WHERE "productVariantId" = $1',
      [VARIANT_ID],
    );
    return Number(rows[0]?.reserved ?? NaN);
  }

  it("creates an order whose locking query joins product and inventory", async () => {
    const before = await reserved();
    const response = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contactName: "Integration",
        contactPhone: "0900000001",
        paymentMethod: "cod",
        shippingAddress: "HCM",
        lines: [{ variantId: VARIANT_ID, quantity: 1 }],
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as { order: { paymentOrderCode: number } };
    expect(body.order.paymentOrderCode).toBeGreaterThan(0);
    expect(await reserved()).toBe(before + 1);
  });

  it("releases expired reservations through the order lock on the reserved-word alias", async () => {
    await dataSource.query(
      `UPDATE orders SET "reservationExpiresAt" = now() - interval '1 hour' WHERE status = 'pending_payment'`,
    );
    const { OrdersService } = await import("./orders/orders.service.js");

    const released = await app.get(OrdersService).releaseExpiredReservations();

    expect(released).toBeGreaterThan(0);
    expect(await reserved()).toBe(0);
  });

  it("releases expired reservations before creating a new order", async () => {
    const order = (lines: number) =>
      fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contactName: "Integration",
          contactPhone: "0900000002",
          paymentMethod: "cod",
          shippingAddress: "HCM",
          lines: [{ variantId: VARIANT_ID, quantity: lines }],
        }),
      });
    expect((await order(1)).status).toBe(201);
    await dataSource.query(
      `UPDATE orders SET "reservationExpiresAt" = now() - interval '1 hour' WHERE status = 'pending_payment'`,
    );

    expect((await order(1)).status).toBe(201);

    expect(await reserved()).toBe(1);
  });
});
