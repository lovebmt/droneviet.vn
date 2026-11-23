import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, createUserToken, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "../test/integration-app.js";

describe.skipIf(!integrationDatabaseUrl)("courses v2", () => {
  let ctx: IntegrationApp;
  let student: string;
  let openSession: string;
  let fullSession: string;
  const slug = `khoa-hoc-${uniqueSuffix()}`;

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    student = await createUserToken(ctx);
    const ds = ctx.dataSource;
    const [p] = await ds.query(`INSERT INTO products (slug,name,summary,kind,status) VALUES ($1,'Khóa học','s','course','published') RETURNING id`, [`p-${slug}`]);
    const [v] = await ds.query(`INSERT INTO product_variants ("productId",sku,title,"priceVnd","purchaseMode","isActive") VALUES ($1,$2,'Học phí',3000000,'quote_only',true) RETURNING id`, [p.id, `C-${slug}`]);
    const [c] = await ds.query(
      `INSERT INTO courses (slug,"productVariantId",locale,title,summary,"purchaseMode","tuitionVnd",level,format,"durationHours","descriptionMarkdown","certificateTrack")
       VALUES ($1,$2,'vi','Bay cơ bản','Học bay an toàn','quote_only',3000000,'co-ban','truc-tiep',16,'Đang cập nhật','chung-chi-co-ban') RETURNING id`,
      [slug, v.id]);
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const [o] = await ds.query(`INSERT INTO course_sessions ("courseId","startsAt",capacity,"reservedSeats",status) VALUES ($1,$2,10,0,'open') RETURNING id`, [c.id, future]);
    const [f] = await ds.query(`INSERT INTO course_sessions ("courseId","startsAt",capacity,"reservedSeats",status) VALUES ($1,$2,2,2,'open') RETURNING id`, [c.id, future]);
    openSession = o.id;
    fullSession = f.id;
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  const enroll = (sessionId: string, token?: string) =>
    fetch(`${ctx.baseUrl}/courses/${slug}/enroll`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ sessionId, name: "Học viên", phone: "0900000002", email: "hv@example.com" }),
    });

  it("lists courses and shows upcoming sessions with seats left", async () => {
    const list = (await (await fetch(`${ctx.baseUrl}/courses`)).json()) as Array<{ slug: string; level: string; format: string }>;
    expect(list.find((c) => c.slug === slug)).toMatchObject({ level: "co-ban", format: "truc-tiep" });
    const detail = await (await fetch(`${ctx.baseUrl}/courses/${slug}`)).json();
    expect(detail).toMatchObject({ slug, title: "Bay cơ bản", durationHours: 16, certificateTrack: "chung-chi-co-ban" });
    expect(detail.sessions).toEqual(expect.arrayContaining([expect.objectContaining({ id: openSession, seatsLeft: 10 })]));
  });

  it("course enroll reserves a seat, decrements seats left and shows in my courses", async () => {
    expect((await enroll(openSession, student)).status).toBe(201);
    const detail = await (await fetch(`${ctx.baseUrl}/courses/${slug}`)).json();
    expect(detail.sessions.find((s: { id: string }) => s.id === openSession).seatsLeft).toBe(9);
    const mine = await (await fetch(`${ctx.baseUrl}/me/courses`, { headers: { authorization: `Bearer ${student}` } })).json();
    expect(mine).toEqual([expect.objectContaining({ status: "reserved", course: { slug, title: "Bay cơ bản" } })]);
  });

  it("enroll in a full session is 409", async () => {
    expect((await enroll(fullSession)).status).toBe(409);
  });

  it("unknown course is 404", async () => {
    expect((await fetch(`${ctx.baseUrl}/courses/khong-co-${slug}`)).status).toBe(404);
  });
});
