import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DataSource } from "typeorm";
import { bootIntegrationApp, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "../test/integration-app.js";

describe.skipIf(!integrationDatabaseUrl)("catalog v2 (public)", () => {
  let ctx: IntegrationApp;
  const s = uniqueSuffix();
  const slug = {
    drone: `t-drone-${s}`,
    part: `t-part-${s}`,
    draft: `t-draft-${s}`,
    combo: `t-combo-${s}`,
    comboTiers: `t-combo-tiers-${s}`,
  };

  async function insertProduct(ds: DataSource, values: Record<string, unknown>): Promise<string> {
    const [row] = await ds.query(
      `INSERT INTO products (slug, name, summary, kind, status, levels, gallery, specs, "inTheBox", faq, badge, "sortOrder", featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        values.slug, values.name, values.summary ?? "s", values.kind, values.status ?? "published",
        JSON.stringify(values.levels ?? []), JSON.stringify(values.gallery ?? []), JSON.stringify(values.specs ?? []),
        JSON.stringify(values.inTheBox ?? []), JSON.stringify(values.faq ?? []), values.badge ?? null,
        values.sortOrder ?? 0, values.featured ?? false,
      ],
    );
    return row.id;
  }

  async function insertVariant(ds: DataSource, productId: string, price: number, mode: string, stock: number) {
    const [variant] = await ds.query(
      `INSERT INTO product_variants ("productId", sku, title, "priceVnd", "purchaseMode", "isActive")
       VALUES ($1,$2,'Mặc định',$3,$4,true) RETURNING id`,
      [productId, `SKU-${productId.slice(0, 8)}-${s}`, price, mode],
    );
    await ds.query(`INSERT INTO inventory_items ("productVariantId", "onHand", reserved) VALUES ($1,$2,0)`, [variant.id, stock]);
  }

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    const ds = ctx.dataSource;
    const drone = await insertProduct(ds, {
      slug: slug.drone, name: "Drone T", kind: "drone", levels: ["thcs"],
      gallery: [{ url: "https://x/a.webp", alt: "Ảnh A" }],
      specs: [{ group: "Bay", items: [{ label: "Thời gian bay", value: "12 phút" }] }],
      inTheBox: ["1 × drone"], faq: [{ q: "Pin?", a: "1S" }], badge: "Bán chạy",
    });
    await insertVariant(ds, drone, 2_490_000, "checkout", 5);
    const part = await insertProduct(ds, { slug: slug.part, name: "Motor T", kind: "part", levels: ["thcs", "thpt"] });
    await insertVariant(ds, part, 190_000, "checkout", 0);
    const draft = await insertProduct(ds, { slug: slug.draft, name: "Draft T", kind: "drone", status: "draft" });
    await insertVariant(ds, draft, 1_000_000, "checkout", 3);
    const combo = await insertProduct(ds, { slug: slug.combo, name: "Combo T", kind: "combo", levels: ["quoc-te"] });
    await ds.query(`INSERT INTO combo_items ("comboId","productId",quantity,note,"sortOrder") VALUES ($1,$2,10,NULL,0),($1,$3,2,'ẩn',1)`, [combo, drone, draft]);
    const comboTiers = await insertProduct(ds, { slug: slug.comboTiers, name: "Combo Tiers T", kind: "combo" });
    await ds.query(
      `INSERT INTO combo_size_tiers ("comboId",students,"priceVnd",label) VALUES ($1,20,185000000,NULL),($1,10,99000000,'Lớp nhỏ')`,
      [comboTiers],
    );
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  const get = (path: string) => fetch(`${ctx.baseUrl}${path}`);
  const slugs = (cards: Array<{ slug: string }>) => cards.map((c) => c.slug);

  it("lists only published products filtered by kind and level", async () => {
    const drones = (await (await get("/catalog/products?kind=drone")).json()) as Array<{ slug: string }>;
    expect(slugs(drones)).toContain(slug.drone);
    expect(slugs(drones)).not.toContain(slug.draft);
    expect(slugs(drones)).not.toContain(slug.combo);

    const thpt = (await (await get("/catalog/products?level=thpt")).json()) as Array<{ slug: string; inStock: boolean }>;
    expect(slugs(thpt)).toContain(slug.part);
    expect(slugs(thpt)).not.toContain(slug.drone);
    expect(thpt.find((c) => c.slug === slug.part)?.inStock).toBe(false);
  });

  it("combo card fromPriceVnd is the cheapest tier, or null without tiers", async () => {
    const combos = (await (await get("/catalog/products?kind=combo")).json()) as Array<{ slug: string; fromPriceVnd: number | null; purchaseMode: string }>;
    expect(combos.find((c) => c.slug === slug.comboTiers)).toMatchObject({ fromPriceVnd: 99_000_000, purchaseMode: "quote_only" });
    expect(combos.find((c) => c.slug === slug.combo)).toMatchObject({ fromPriceVnd: null, purchaseMode: "quote_only" });
  });

  it("detail returns gallery, specs, variants with stock and combo items with quantities", async () => {
    const drone = await (await get(`/catalog/products/${slug.drone}`)).json();
    expect(drone).toMatchObject({
      slug: slug.drone,
      badge: "Bán chạy",
      fromPriceVnd: 2_490_000,
      gallery: [{ url: "https://x/a.webp", alt: "Ảnh A" }],
      specs: [{ group: "Bay", items: [{ label: "Thời gian bay", value: "12 phút" }] }],
      inTheBox: ["1 × drone"],
      variants: [expect.objectContaining({ priceVnd: 2_490_000, purchaseMode: "checkout", stock: 5 })],
    });

    const combo = await (await get(`/catalog/products/${slug.combo}`)).json();
    expect(combo.comboItems).toEqual([
      expect.objectContaining({ quantity: 10, product: expect.objectContaining({ slug: slug.drone }) }),
    ]);
    const tiers = await (await get(`/catalog/products/${slug.comboTiers}`)).json();
    expect(tiers.sizeTiers).toEqual([
      { students: 10, priceVnd: 99_000_000, label: "Lớp nhỏ" },
      { students: 20, priceVnd: 185_000_000, label: null },
    ]);
  });

  it("combo detail omits items whose product is a draft", async () => {
    const combo = await (await get(`/catalog/products/${slug.combo}`)).json();
    expect(JSON.stringify(combo)).not.toContain(slug.draft);
  });

  it("unknown or draft slug returns 404", async () => {
    expect((await get(`/catalog/products/${slug.draft}`)).status).toBe(404);
    expect((await get(`/catalog/products/khong-co-${s}`)).status).toBe(404);
  });
});
