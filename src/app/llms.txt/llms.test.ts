import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/api/types";
import { article, card, comboQuocTe } from "@/test/fixtures";

const api = vi.hoisted(() => ({ listProducts: vi.fn(), listArticles: vi.fn(), getArticle: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);

const { GET: llms } = await import("./route");
const { GET: llmsFull } = await import("../llms-full.txt/route");

beforeEach(() => {
  api.listProducts.mockReset().mockImplementation(async (kind: string) => (kind === "combo" ? [comboQuocTe] : kind === "drone" ? [card({ slug: "dv-code-fleet", name: "DV Code Fleet", summary: "Drone lập trình cho lớp học" })] : []));
  api.listArticles.mockReset().mockImplementation(async (opts?: { kind?: string }) =>
    opts?.kind === "phap-ly" ? [article({ slug: "cap-phep-bay-drone", title: "Xin phép bay drone", kind: "phap-ly" })] : [article({ slug: "lap-rap-f450", title: "Lắp ráp drone F450" })],
  );
  api.getArticle.mockReset().mockImplementation(async (slug: string) => ({ ...article({ slug, title: slug }), bodyMarkdown: `## Nội dung của ${slug}\n\nChi tiết.`, attachments: [], relatedProducts: [], seoTitle: null, seoDescription: null }));
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
});

describe("llms.txt", () => {
  it("is plain text in the llmstxt.org shape with the site's key pages", async () => {
    const res = await llms();
    const text = await res.text();
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(text.startsWith("# Drone Việt\n\n> ")).toBe(true);
    for (const link of [
      "(https://www.droneviet.vn/cua-hang/combo/combo-lop-hoc-quoc-te)",
      "(https://www.droneviet.vn/cua-hang/dv-code-fleet)",
      "(https://www.droneviet.vn/giao-duc/tieu-hoc)",
      "(https://www.droneviet.vn/giao-duc/workshop)",
      "(https://www.droneviet.vn/dao-tao/cap-phep)",
      "(https://www.droneviet.vn/dao-tao/ban-do)",
      "(https://www.droneviet.vn/bay-mo-phong)",
      "(https://www.droneviet.vn/r-d/lap-rap-f450)",
      "(https://www.droneviet.vn/llms-full.txt)",
    ]) expect(text).toContain(link);
    expect(text).toContain(`https://zalo.me/${DEFAULT_SETTINGS.contact.zalo}`);
    expect(text).not.toContain("/admin");
  });

  it("llms-full.txt carries the legal guides and articles in full", async () => {
    const text = await (await llmsFull()).text();
    expect(text).toContain("# Drone Việt");
    expect(text).toContain("## Nội dung của cap-phep-bay-drone");
    expect(text).toContain("Nguồn: https://www.droneviet.vn/dao-tao/cap-phep");
    expect(text).toContain("## Nội dung của lap-rap-f450");
    expect(text).toContain("Nguồn: https://www.droneviet.vn/r-d/lap-rap-f450");
    expect(text).toContain("Thông tin tham khảo, không thay thế văn bản pháp luật");
  });
});
