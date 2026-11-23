import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "../test/integration-app.js";

const TOKEN = "content-token-for-integration-0001";

describe.skipIf(!integrationDatabaseUrl)("content publishing API", () => {
  let ctx: IntegrationApp;
  const s = uniqueSuffix();
  const slug = `bai-thu-${s}`;
  const productSlug = `p-${s}`;

  beforeAll(async () => {
    // Revalidation points at a closed port: publishing must still succeed.
    ctx = await bootIntegrationApp({ CONTENT_PUBLISH_TOKEN: TOKEN, WEB_REVALIDATE_URL: "http://127.0.0.1:9/api/revalidate", WEB_REVALIDATE_SECRET: "x" });
    const [p] = await ctx.dataSource.query(`INSERT INTO products (slug,name,summary,kind,status) VALUES ($1,'P','s','drone','published') RETURNING id`, [productSlug]);
    const [v] = await ctx.dataSource.query(`INSERT INTO product_variants ("productId",sku,title,"priceVnd","purchaseMode","isActive") VALUES ($1,$2,'M',100000,'checkout',true) RETURNING id`, [p.id, `C-${s}`]);
    await ctx.dataSource.query(`INSERT INTO inventory_items ("productVariantId","onHand",reserved) VALUES ($1,3,0)`, [v.id]);
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  const call = (method: string, path: string, body?: unknown, token = TOKEN) =>
    fetch(`${ctx.baseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  it("token can upsert and publish an article that then appears publicly", async () => {
    const draft = {
      title: "Lắp ráp drone F450",
      summary: "Hướng dẫn cho lớp 6",
      bodyMarkdown: "# Chuẩn bị\n\n::youtube{id=dQw4w9WgXcQ}\n\nNội dung " + "chữ ".repeat(450),
      tags: ["lap-rap"],
      levels: ["thcs"],
      kind: "guide",
      relatedProductSlugs: [productSlug],
      attachments: [{ url: "https://api.test/media/x/giao-an.pdf", label: "Giáo án" }],
    };
    expect((await call("PUT", `/admin/content/articles/${slug}`, draft)).status).toBe(200);
    expect((await fetch(`${ctx.baseUrl}/content/articles/${slug}`)).status).toBe(404);

    const started = Date.now();
    expect((await call("POST", `/admin/content/articles/${slug}/publish`)).status).toBe(201);
    expect(Date.now() - started).toBeLessThan(3_500);

    const list = (await (await fetch(`${ctx.baseUrl}/content/articles?tag=lap-rap`)).json()) as Array<{ slug: string; readingMinutes: number }>;
    expect(list.map((a) => a.slug)).toContain(slug);
    expect(list.find((a) => a.slug === slug)?.readingMinutes).toBeGreaterThanOrEqual(2);

    const article = await (await fetch(`${ctx.baseUrl}/content/articles/${slug}`)).json();
    expect(article).toMatchObject({
      slug,
      title: "Lắp ráp drone F450",
      bodyMarkdown: draft.bodyMarkdown,
      attachments: draft.attachments,
      relatedProducts: [expect.objectContaining({ slug: productSlug })],
    });
  });

  it("unpublish hides the article again", async () => {
    expect((await call("POST", `/admin/content/articles/${slug}/unpublish`)).status).toBe(201);
    expect((await fetch(`${ctx.baseUrl}/content/articles/${slug}`)).status).toBe(404);
  });

  it("legal articles are listed only when asked for", async () => {
    const legal = `phap-ly-${s}`;
    const guide = `huong-dan-${s}`;
    for (const [slug, kind] of [[legal, "phap-ly"], [guide, "guide"]] as const) {
      expect((await call("PUT", `/admin/content/articles/${slug}`, { title: slug, bodyMarkdown: "Nội dung", kind })).status).toBe(200);
      expect((await call("POST", `/admin/content/articles/${slug}/publish`)).status).toBe(201);
    }
    const slugs = async (query: string) => ((await (await fetch(`${ctx.baseUrl}/content/articles${query}`)).json()) as Array<{ slug: string }>).map((a) => a.slug);
    const all = await slugs("");
    expect(all).toContain(guide);
    expect(all).not.toContain(legal);
    const legalOnly = await slugs("?kind=phap-ly");
    expect(legalOnly).toContain(legal);
    expect(legalOnly).not.toContain(guide);
    expect((await fetch(`${ctx.baseUrl}/content/articles/${legal}`)).status).toBe(200);
  });

  it("wrong token gets 401", async () => {
    expect((await call("PUT", `/admin/content/articles/${slug}`, { title: "x", bodyMarkdown: "x" }, "wrong")).status).toBe(401);
  });

  it("draft article is 404 publicly", async () => {
    await call("PUT", `/admin/content/articles/nhap-${s}`, { title: "Nháp", bodyMarkdown: "x" });
    expect((await fetch(`${ctx.baseUrl}/content/articles/nhap-${s}`)).status).toBe(404);
  });

  it("the content token can upload media", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), "so-do.png");
    const response = await fetch(`${ctx.baseUrl}/admin/media`, { method: "POST", headers: { authorization: `Bearer ${TOKEN}` }, body: form });
    expect(response.status).toBe(201);
  });
});
