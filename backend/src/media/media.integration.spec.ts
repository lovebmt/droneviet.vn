import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, createUserToken, integrationDatabaseUrl, type IntegrationApp } from "../test/integration-app.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
function webp(): Buffer {
  const body = Buffer.concat([Buffer.from("WEBPVP8 "), Buffer.alloc(24, 1)]);
  const header = Buffer.alloc(8);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

describe.skipIf(!integrationDatabaseUrl)("media uploads", () => {
  let ctx: IntegrationApp;
  let admin: string;

  beforeAll(async () => {
    ctx = await bootIntegrationApp({ PUBLIC_API_URL: "https://api.test" });
    admin = await createUserToken(ctx, ["super_admin"]);
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  function upload(bytes: Buffer, filename: string, type = "application/octet-stream") {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)], { type }), filename);
    form.append("alt", "Drone trong lớp học");
    return fetch(`${ctx.baseUrl}/admin/media`, { method: "POST", headers: { authorization: `Bearer ${admin}` }, body: form });
  }

  it("stores a webp and serves it with immutable caching", async () => {
    const bytes = webp();
    const response = await upload(bytes, "Ảnh Lớp Học.webp", "image/webp");
    expect(response.status).toBe(201);
    const media = (await response.json()) as { id: string; url: string; mime: string; bytes: number };
    expect(media).toMatchObject({ mime: "image/webp", bytes: bytes.length });
    expect(media.url).toMatch(new RegExp(`^https://api\\.test/media/${media.id}/[a-z0-9-]+\\.webp$`));

    const served = await fetch(`${ctx.baseUrl}${new URL(media.url).pathname}`);
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/webp");
    expect(served.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(Buffer.from(await served.arrayBuffer())).toEqual(bytes);
  });

  it("rejects a text file renamed .png with 400", async () => {
    expect((await upload(Buffer.from("not an image at all"), "fake.png", "image/png")).status).toBe(400);
  });

  it("rejects 4 MB + 1 byte with 413", async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024 + 1 - PNG.length)]);
    expect((await upload(big, "big.png", "image/png")).status).toBe(413);
  });

  it("rejects svg containing script", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect((await upload(svg, "x.svg", "image/svg+xml")).status).toBe(400);
    const handler = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect onload="alert(1)"/></svg>');
    expect((await upload(handler, "y.svg", "image/svg+xml")).status).toBe(400);
  });

  it("serves media sandboxed so an SVG can never run script on the API origin", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4"/></svg>');
    const media = (await (await upload(svg, "so-do.svg", "image/svg+xml")).json()) as { url: string };
    const served = await fetch(`${ctx.baseUrl}${new URL(media.url).pathname}`);
    expect(served.headers.get("content-security-policy")).toBe("default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
    expect(served.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("GET unknown id returns 404", async () => {
    expect((await fetch(`${ctx.baseUrl}/media/00000000-0000-4000-8000-000000000000/x.webp`)).status).toBe(404);
  });
});
