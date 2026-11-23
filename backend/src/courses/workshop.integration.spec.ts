import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, createUserToken, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "../test/integration-app.js";

const ZALO = "https://zalo.me/g/workshop-drone";

describe.skipIf(!integrationDatabaseUrl)("workshops (courses with level workshop)", () => {
  let ctx: IntegrationApp;
  let instructor: string;
  let customer: string;
  let session: string;
  const slug = `workshop-${uniqueSuffix()}`;

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    instructor = await createUserToken(ctx, ["instructor"]);
    customer = await createUserToken(ctx);
    const ds = ctx.dataSource;
    const [p] = await ds.query(`INSERT INTO products (slug,name,summary,kind,status) VALUES ($1,'Workshop','s','course','published') RETURNING id`, [`p-${slug}`]);
    const [v] = await ds.query(`INSERT INTO product_variants ("productId",sku,title,"priceVnd","purchaseMode","isActive") VALUES ($1,$2,'Vé',0,'quote_only',true) RETURNING id`, [p.id, `W-${slug}`]);
    const [c] = await ds.query(
      `INSERT INTO courses (slug,"productVariantId",locale,title,summary,"purchaseMode",level,format,"zaloGroupUrl")
       VALUES ($1,$2,'vi','Workshop trải nghiệm','Bay thử drone','quote_only','workshop','truc-tiep',$3) RETURNING id`,
      [slug, v.id, ZALO]);
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const [s] = await ds.query(`INSERT INTO course_sessions ("courseId","startsAt",capacity,"reservedSeats",status) VALUES ($1,$2,20,0,'open') RETURNING id`, [c.id, future]);
    session = s.id;
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  const enroll = (body: Record<string, unknown>) =>
    fetch(`${ctx.baseUrl}/courses/${slug}/enroll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session, name: "Cô Lan", phone: "0900000003", ...body }),
    });
  const seatsLeft = async () => ((await (await fetch(`${ctx.baseUrl}/courses/${slug}`)).json()) as { sessions: Array<{ id: string; seatsLeft: number }> }).sessions.find((x) => x.id === session)!.seatsLeft;

  it("lists only workshops with ?level=workshop", async () => {
    const list = (await (await fetch(`${ctx.baseUrl}/courses?level=workshop`)).json()) as Array<{ slug: string; level: string; zaloGroupUrl: string | null }>;
    expect(list.find((c) => c.slug === slug)).toMatchObject({ level: "workshop", zaloGroupUrl: ZALO });
    expect(list.every((c) => c.level === "workshop")).toBe(true);
  });

  it("enroll stores organization, note and group size and returns the Zalo link", async () => {
    const res = await enroll({ organization: "THCS Nguyễn Du", note: "Lớp 7A", quantity: 12 });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ status: "reserved", zaloGroupUrl: ZALO });
    const [row] = await ctx.dataSource.query(`SELECT organization, note, quantity FROM course_enrollments WHERE "sessionId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [session]);
    expect(row).toEqual({ organization: "THCS Nguyễn Du", note: "Lớp 7A", quantity: 12 });
    expect(await seatsLeft()).toBe(8);
  });

  it("rejects a group larger than the seats left", async () => {
    expect((await enroll({ quantity: 9 })).status).toBe(409);
    expect(await seatsLeft()).toBe(8);
  });

  it("admin sets the Zalo group link", async () => {
    const patch = (token: string, body: unknown) =>
      fetch(`${ctx.baseUrl}/admin/courses/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
    expect((await patch(customer, { zaloGroupUrl: ZALO })).status).toBe(403);
    expect((await patch(instructor, { zaloGroupUrl: "https://evil.example/g" })).status).toBe(400);
    const next = "https://zalo.me/g/workshop-thang-12";
    expect((await patch(instructor, { zaloGroupUrl: next, summary: "Một buổi bay thử" })).status).toBe(200);
    const detail = await (await fetch(`${ctx.baseUrl}/courses/${slug}`)).json();
    expect(detail).toMatchObject({ zaloGroupUrl: next, summary: "Một buổi bay thử" });
    expect((await patch(instructor, { zaloGroupUrl: null })).status).toBe(200);
    expect((await (await fetch(`${ctx.baseUrl}/courses/${slug}`)).json()).zaloGroupUrl).toBeNull();
  });
});
