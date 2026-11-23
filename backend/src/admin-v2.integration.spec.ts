import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, createUserToken, integrationDatabaseUrl, type IntegrationApp, uniqueSuffix } from "./test/integration-app.js";

const PNG = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");

describe.skipIf(!integrationDatabaseUrl)("admin v2 endpoints", () => {
  let ctx: IntegrationApp;
  let admin: string;
  let customer: string;
  let sales: string;
  let instructor: string;
  const s = uniqueSuffix();
  const slug = `khoa-admin-${s}`;

  beforeAll(async () => {
    ctx = await bootIntegrationApp({ CONTENT_PUBLISH_TOKEN: "content-token-admin-0001" });
    [admin, customer, sales, instructor] = await Promise.all([
      createUserToken(ctx, ["super_admin"]),
      createUserToken(ctx, ["customer"]),
      createUserToken(ctx, ["sales"]),
      createUserToken(ctx, ["instructor"]),
    ]);
    const ds = ctx.dataSource;
    const [p] = await ds.query(`INSERT INTO products (slug,name,summary,kind,status) VALUES ($1,'K','s','course','published') RETURNING id`, [`p-${slug}`]);
    const [v] = await ds.query(`INSERT INTO product_variants ("productId",sku,title,"priceVnd","purchaseMode","isActive") VALUES ($1,$2,'Học phí',1000000,'quote_only',true) RETURNING id`, [p.id, `A-${s}`]);
    await ds.query(
      `INSERT INTO courses (slug,"productVariantId",locale,title,summary,"purchaseMode","tuitionVnd",level,format,"durationHours","descriptionMarkdown","certificateTrack")
       VALUES ($1,$2,'vi','Khóa admin','s','quote_only',1000000,'co-ban','truc-tiep',8,'x',null)`, [slug, v.id]);
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  const withCookie = (token: string) => ({ cookie: `dv_session=${token}` });
  const call = (method: string, path: string, token: string, body?: unknown) =>
    fetch(`${ctx.baseUrl}${path}`, {
      method,
      headers: { "content-type": "application/json", ...withCookie(token) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  it("admin cookie can list articles", async () => {
    expect((await call("GET", "/admin/content/articles", admin)).status).toBe(200);
  });

  it("customer cookie is 401 on admin articles", async () => {
    expect((await call("GET", "/admin/content/articles", customer)).status).toBe(401);
  });

  it("sales lists and updates quotes, customer gets 403", async () => {
    await fetch(`${ctx.baseUrl}/quotes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organization: `Trường ${s}`, contactName: "Cô Lan", phone: "0912345678", quantity: 1 }),
    });
    const list = (await (await call("GET", "/admin/quotes?status=new", sales)).json()) as Array<{ id: string; organization: string; status: string }>;
    const quote = list.find((q) => q.organization === `Trường ${s}`)!;
    expect(quote.status).toBe("new");
    const patched = await call("PATCH", `/admin/quotes/${quote.id}`, sales, { status: "qualified" });
    expect(await patched.json()).toMatchObject({ id: quote.id, status: "qualified" });
    expect((await call("GET", "/admin/quotes", customer)).status).toBe(403);
  });

  it("instructor creates a session and confirms an enrollment", async () => {
    const startsAt = new Date(Date.now() + 10 * 86_400_000).toISOString();
    const created = await call("POST", `/admin/courses/${slug}/sessions`, instructor, { startsAt, capacity: 5 });
    expect(created.status).toBe(201);
    const session = (await created.json()) as { id: string };
    const enrolled = await fetch(`${ctx.baseUrl}/courses/${slug}/enroll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, name: "Học viên", phone: "0900000003" }),
    });
    const enrollment = (await enrolled.json()) as { id: string };
    const courses = (await (await call("GET", "/admin/courses", instructor)).json()) as Array<{ slug: string; sessions: Array<{ id: string; reservedSeats: number; enrollments: number }> }>;
    expect(courses.find((c) => c.slug === slug)!.sessions.find((x) => x.id === session.id)).toMatchObject({ reservedSeats: 1, enrollments: 1 });
    const people = (await (await call("GET", `/admin/course-sessions/${session.id}/enrollments`, instructor)).json()) as Array<{ id: string; contactName: string }>;
    expect(people[0]).toMatchObject({ id: enrollment.id, contactName: "Học viên" });
    expect(await (await call("PATCH", `/admin/enrollments/${enrollment.id}`, instructor, { status: "confirmed" })).json()).toMatchObject({ status: "confirmed" });
    await call("PATCH", `/admin/enrollments/${enrollment.id}`, instructor, { status: "cancelled" });
    const after = (await (await call("GET", "/admin/courses", instructor)).json()) as typeof courses;
    expect(after.find((c) => c.slug === slug)!.sessions.find((x) => x.id === session.id)!.reservedSeats).toBe(0);
    expect((await call("PATCH", `/admin/course-sessions/${session.id}`, instructor, { status: "closed" })).status).toBe(200);
  });

  it("media list returns uploaded files", async () => {
    const form = new FormData();
    form.append("file", new Blob([PNG], { type: "image/png" }), `anh-${s}.png`);
    const upload = await fetch(`${ctx.baseUrl}/admin/media`, { method: "POST", headers: withCookie(admin), body: form });
    expect(upload.status).toBe(201);
    const { id } = (await upload.json()) as { id: string };
    const list = (await (await call("GET", "/admin/media", admin)).json()) as Array<{ id: string; url: string }>;
    expect(list[0]).toMatchObject({ id });
    expect(list[0].url).toContain(`/media/${id}/`);
  });
});
