import { describe, expect, it, vi } from "vitest";
import { buildPayload, localAssets, parseArticle, publishArticle, rewriteBody } from "./lib.mjs";

const SOURCE = `---
slug: lap-rap-f450
title: Lắp ráp drone F450 cho lớp 8
summary: Hướng dẫn từng bước.
kind: guide
locale: vi
tags: [lap-rap, thcs]
levels: [thcs]
cover: ./anh/bia.webp
related: [dv-code-fleet]
attachments:
  - src: ./giao-an.pdf
    label: Giáo án
seoTitle: Lắp ráp F450
---
## Chuẩn bị

![Khung F450](./anh/khung.webp)

![Lại khung](./anh/khung.webp)

![Ảnh ngoài](https://example.com/x.jpg)

::youtube{id=dQw4w9WgXcQ}

::file{src=./so-do.pdf label="Sơ đồ đấu dây"}
`;

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fakeApi(fail?: string) {
  const calls: Array<{ method: string; path: string; body: unknown }> = [];
  let n = 0;
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname;
    calls.push({ method: init.method ?? "GET", path, body: typeof init.body === "string" ? JSON.parse(init.body) : init.body instanceof FormData ? "form" : undefined });
    if (fail && path === fail) return new Response(JSON.stringify({ message: "boom" }), { status: 400 });
    if (path === "/admin/media") return new Response(JSON.stringify({ id: `m${++n}`, url: `https://api.test/media/m${n}/f` }), { status: 201 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  return { fetch, calls };
}

const files = (missing: string[] = []) => async (path: string) => {
  if (missing.some((m) => path.endsWith(m))) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
  return PNG;
};

describe("rd publishing", () => {
  it("front matter maps to the API payload", () => {
    const { meta, body } = parseArticle(SOURCE);
    const payload = buildPayload(meta, body, new Map([["./anh/bia.webp", "https://api.test/media/c/bia.webp"], ["./giao-an.pdf", "https://api.test/media/g/giao-an.pdf"]]));
    expect(payload).toMatchObject({
      title: "Lắp ráp drone F450 cho lớp 8",
      summary: "Hướng dẫn từng bước.",
      kind: "guide",
      locale: "vi",
      tags: ["lap-rap", "thcs"],
      levels: ["thcs"],
      coverImageUrl: "https://api.test/media/c/bia.webp",
      relatedProductSlugs: ["dv-code-fleet"],
      attachments: [{ url: "https://api.test/media/g/giao-an.pdf", label: "Giáo án" }],
      seoTitle: "Lắp ráp F450",
    });
    expect(payload.bodyMarkdown.startsWith("## Chuẩn bị")).toBe(true);
  });

  it("local images, cover and files are uploaded once and links rewritten", async () => {
    const { meta, body } = parseArticle(SOURCE);
    expect(localAssets(meta, body).sort()).toEqual(["./anh/bia.webp", "./anh/khung.webp", "./giao-an.pdf", "./so-do.pdf"]);
    const out = rewriteBody(body, new Map([["./anh/khung.webp", "https://api.test/media/k/khung.webp"], ["./so-do.pdf", "https://api.test/media/s/so-do.pdf"]]));
    expect(out.match(/https:\/\/api\.test\/media\/k\/khung\.webp/g)).toHaveLength(2);
    expect(out).toContain('::file{url=https://api.test/media/s/so-do.pdf label="Sơ đồ đấu dây"}');

    const api = fakeApi();
    await publishArticle("/x/lap-rap-f450", { api: "https://api.test", token: "t", publish: false, fetch: api.fetch, readFile: files(), readText: async () => SOURCE });
    expect(api.calls.filter((c) => c.path === "/admin/media")).toHaveLength(4);
    const put = api.calls.find((c) => c.method === "PUT")!;
    expect(put.path).toBe("/admin/content/articles/lap-rap-f450");
    expect(JSON.stringify(put.body)).not.toContain("./anh/");
  });

  it("remote image URLs are untouched", () => {
    const { meta, body } = parseArticle(SOURCE);
    expect(localAssets(meta, body)).not.toContain("https://example.com/x.jpg");
    expect(rewriteBody(body, new Map())).toContain("![Ảnh ngoài](https://example.com/x.jpg)");
  });

  it("a missing file stops before any upload", async () => {
    const api = fakeApi();
    await expect(publishArticle("/x/a", { api: "https://api.test", token: "t", publish: false, fetch: api.fetch, readFile: files(["so-do.pdf"]), readText: async () => SOURCE })).rejects.toThrow(/so-do\.pdf/);
    expect(api.calls).toHaveLength(0);
  });

  it("unsupported file type is refused", async () => {
    const api = fakeApi();
    const source = SOURCE.replace("./anh/khung.webp)", "./anh/khung.gif)");
    await expect(publishArticle("/x/a", { api: "https://api.test", token: "t", publish: false, fetch: api.fetch, readFile: files(), readText: async () => source })).rejects.toThrow(/khung\.gif/);
    expect(api.calls).toHaveLength(0);
  });

  it("--publish calls the publish endpoint after the upsert", async () => {
    const api = fakeApi();
    await publishArticle("/x/a", { api: "https://api.test", token: "t", publish: true, fetch: api.fetch, readFile: files(), readText: async () => SOURCE });
    const order = api.calls.filter((c) => c.path.startsWith("/admin/content")).map((c) => `${c.method} ${c.path}`);
    expect(order).toEqual(["PUT /admin/content/articles/lap-rap-f450", "POST /admin/content/articles/lap-rap-f450/publish"]);
  });

  it("dry run uploads nothing", async () => {
    const api = fakeApi();
    const result = await publishArticle("/x/a", { api: "https://api.test", token: "", publish: true, dryRun: true, fetch: api.fetch, readFile: files(), readText: async () => SOURCE });
    expect(api.calls).toHaveLength(0);
    expect(result.payload.title).toBe("Lắp ráp drone F450 cho lớp 8");
  });
});
