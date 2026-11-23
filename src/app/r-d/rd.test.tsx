import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import type { Article } from "@/lib/api/types";
import { article, card } from "@/test/fixtures";

const api = vi.hoisted(() => ({ listArticles: vi.fn(), getArticle: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { default: ListPage } = await import("./page");
const { default: ArticlePage } = await import("./[slug]/page");

const full: Article = {
  ...article(),
  bodyMarkdown: "## Chuẩn bị linh kiện\n\nNội dung **đậm**.\n\n::product{slug=dv-code-fleet}\n\n## Lắp khung\n\nBước tiếp theo.",
  attachments: [{ url: "https://api.droneviet.vn/media/x/so-do.pdf", label: "Sơ đồ đấu dây" }],
  relatedProducts: [card()],
  seoTitle: null,
  seoDescription: null,
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  api.listArticles.mockReset().mockResolvedValue([article(), article({ slug: "b", title: "Nghiên cứu cảm biến", tags: ["cam-bien"] })]);
  api.getArticle.mockReset().mockResolvedValue(full);
});

describe("R&D", () => {
  it("list filters by tag", async () => {
    api.listArticles.mockImplementation(async (opts?: { tag?: string }) => (opts?.tag === "cam-bien" ? [article({ slug: "b", title: "Nghiên cứu cảm biến", tags: ["cam-bien"] })] : [article()]));
    render(<AppProviders>{await ListPage({ searchParams: Promise.resolve({ tag: "cam-bien" }) })}</AppProviders>);
    expect(api.listArticles).toHaveBeenCalledWith(expect.objectContaining({ tag: "cam-bien" }));
    expect(screen.getByRole("link", { name: /Nghiên cứu cảm biến/ })).toHaveAttribute("href", "/r-d/b");
    expect(screen.queryByText("Lắp ráp drone F450")).not.toBeInTheDocument();
  });

  it("article page renders Markdown and related products", async () => {
    const { container } = render(<AppProviders>{await ArticlePage({ params: Promise.resolve({ slug: "lap-rap-f450" }) })}</AppProviders>);
    expect(screen.getByRole("heading", { level: 1, name: "Lắp ráp drone F450" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Chuẩn bị linh kiện" })).toHaveAttribute("id", "chuan-bi-linh-kien");
    const toc = screen.getByRole("navigation", { name: "Mục lục" });
    expect(toc.querySelector('a[href="#lap-khung"]')).not.toBeNull();
    expect(screen.getAllByRole("link", { name: /DV Code Fleet/ })[0]).toHaveAttribute("href", "/cua-hang/dv-code-fleet");
    expect(screen.getByRole("link", { name: /Sơ đồ đấu dây/ })).toHaveAttribute("href", full.attachments[0].url);
    const json = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(json).toMatchObject({ "@type": "Article", headline: "Lắp ráp drone F450" });
  });

  it("missing article calls notFound", async () => {
    api.getArticle.mockResolvedValue(null);
    await expect(ArticlePage({ params: Promise.resolve({ slug: "khong-co" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
