import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, integrationDatabaseUrl, type IntegrationApp } from "../test/integration-app.js";

const COMBOS = ["combo-tieu-hoc", "combo-stem-lap-trinh", "combo-lop-hoc-quoc-te"];

describe.skipIf(!integrationDatabaseUrl)("seed v2 (placeholder content)", () => {
  let ctx: IntegrationApp;
  let seedV2: (manager: import("typeorm").EntityManager) => Promise<void>;

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    ({ seedV2 } = await import("./seed-v2.js"));
    await seedV2(ctx.dataSource.manager);
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  const count = async (sql: string, params: unknown[] = []) => Number((await ctx.dataSource.query(sql, params))[0].n);

  it("seeding twice leaves one row per slug", async () => {
    await seedV2(ctx.dataSource.manager);
    for (const slug of [...COMBOS, "dv-primary-lab", "dv-code-fleet"]) {
      expect(await count(`SELECT count(*) AS n FROM products WHERE slug = $1`, [slug])).toBe(1);
    }
    expect(await count(`SELECT count(*) AS n FROM combo_items ci JOIN products p ON p.id = ci."comboId" WHERE p.slug = 'combo-tieu-hoc'`)).toBe(2);
  });

  it("existing prices, stock and admin edits are not overwritten", async () => {
    const [variant] = await ctx.dataSource.query(
      `SELECT v.id FROM product_variants v JOIN products p ON p.id = v."productId" WHERE p.slug = 'dv-primary-lab' LIMIT 1`);
    await ctx.dataSource.query(`UPDATE product_variants SET "priceVnd" = 1234567 WHERE id = $1`, [variant.id]);
    await ctx.dataSource.query(`UPDATE inventory_items SET "onHand" = 77 WHERE "productVariantId" = $1`, [variant.id]);
    await ctx.dataSource.query(`UPDATE products SET badge = 'Admin đã sửa' WHERE slug = 'dv-primary-lab'`);

    await seedV2(ctx.dataSource.manager);

    expect((await ctx.dataSource.query(`SELECT "priceVnd" FROM product_variants WHERE id = $1`, [variant.id]))[0].priceVnd).toBe("1234567");
    expect((await ctx.dataSource.query(`SELECT "onHand" FROM inventory_items WHERE "productVariantId" = $1`, [variant.id]))[0].onHand).toBe(77);
    expect((await ctx.dataSource.query(`SELECT badge FROM products WHERE slug = 'dv-primary-lab'`))[0].badge).toBe("Admin đã sửa");
  });

  it("combos are published with items, quote-only and no size tiers", async () => {
    const combos = (await (await fetch(`${ctx.baseUrl}/catalog/products?kind=combo`)).json()) as Array<{ slug: string; fromPriceVnd: number | null }>;
    for (const slug of COMBOS) {
      expect(combos.find((c) => c.slug === slug)).toMatchObject({ fromPriceVnd: null });
      const detail = await (await fetch(`${ctx.baseUrl}/catalog/products/${slug}`)).json();
      expect(detail.comboItems.length).toBeGreaterThan(0);
      expect(detail.sizeTiers).toEqual([]);
    }
  });

  it("enriches existing products with gallery attribution, levels and specs", async () => {
    const detail = await (await fetch(`${ctx.baseUrl}/catalog/products/dv-code-fleet`)).json();
    expect(detail.gallery[0]).toMatchObject({ url: expect.stringMatching(/^\/store\/quadcopter-flight-0\d\.jpg$/), alt: expect.stringContaining("CC BY-SA 3.0") });
    expect(detail.levels).toEqual(expect.arrayContaining(["thcs"]));
    expect(detail.specs.length).toBeGreaterThan(0);
  });

  it("an admin un-featuring a product survives a re-seed", async () => {
    await ctx.dataSource.query(`UPDATE products SET featured = false WHERE slug = 'dv-code-fleet'`);
    await seedV2(ctx.dataSource.manager);
    expect((await ctx.dataSource.query(`SELECT featured FROM products WHERE slug = 'dv-code-fleet'`))[0].featured).toBe(false);
  });

  it("courses get placeholder descriptions marked as being updated", async () => {
    const course = await (await fetch(`${ctx.baseUrl}/courses/lap-trinh-drone-cap-2`)).json();
    expect(course.descriptionMarkdown).toContain("Đang cập nhật");
  });
});
