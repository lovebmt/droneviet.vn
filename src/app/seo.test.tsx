import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { article, card, comboQuocTe, detail } from "@/test/fixtures";

const api = vi.hoisted(() => ({ listProducts: vi.fn(), listArticles: vi.fn(), listCourses: vi.fn(), getProduct: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { default: SearchPage } = await import("./tim-kiem/page");
const { default: sitemap } = await import("./sitemap");
const { default: robots } = await import("./robots");
const { default: EnComboPage } = await import("./en/combo/[slug]/page");
const { default: NotFound } = await import("./not-found");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  api.listProducts.mockReset().mockImplementation(async (kind: string) =>
    kind === "combo" ? [comboQuocTe] : kind === "drone" ? [card({ slug: "dv-ai-vision", name: "DV AI Vision", summary: "Nhận diện hình ảnh" })] : kind === "part" ? [card({ slug: "dong-co", name: "Động cơ 2205", kind: "part" })] : [],
  );
  api.listArticles.mockResolvedValue([article({ title: "Lắp ráp drone F450" })]);
  api.listCourses.mockResolvedValue([{ slug: "drone-nhap-mon", title: "Nhập môn", summary: "", level: "co-ban", format: "truc-tiep", durationHours: 1, tuitionVnd: null, certificateTrack: null }]);
});

describe("search", () => {
  it("search matches without diacritics", async () => {
    render(<AppProviders>{await SearchPage({ searchParams: Promise.resolve({ q: "dong co" }) })}</AppProviders>);
    expect(screen.getByRole("link", { name: /Động cơ 2205/ })).toHaveAttribute("href", "/cua-hang/dong-co");
    expect(screen.queryByText("DV AI Vision")).not.toBeInTheDocument();
  });

  it("search finds articles and shows an empty state for no match", async () => {
    const view = render(<AppProviders>{await SearchPage({ searchParams: Promise.resolve({ q: "LAP RAP" }) })}</AppProviders>);
    expect(screen.getByRole("link", { name: /Lắp ráp drone F450/ })).toHaveAttribute("href", "/r-d/lap-rap-f450");
    view.unmount();
    render(<AppProviders>{await SearchPage({ searchParams: Promise.resolve({ q: "zzzz" }) })}</AppProviders>);
    expect(screen.getByText(/Không tìm thấy kết quả/)).toBeInTheDocument();
  });
});

describe("SEO", () => {
  it("sitemap lists products, combos and articles from the API", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).toEqual(expect.arrayContaining([
      "https://www.droneviet.vn/",
      "https://www.droneviet.vn/cua-hang/combo/combo-lop-hoc-quoc-te",
      "https://www.droneviet.vn/cua-hang/dv-ai-vision",
      "https://www.droneviet.vn/r-d/lap-rap-f450",
      "https://www.droneviet.vn/giao-duc/thcs",
      "https://www.droneviet.vn/giao-duc/workshop",
    ]));
  });

  it("sitemap has neither the removed overview pages nor course pages", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const removed of ["https://www.droneviet.vn/giao-duc", "https://www.droneviet.vn/dao-tao", "https://www.droneviet.vn/dao-tao/drone-nhap-mon"]) {
      expect(urls).not.toContain(removed);
    }
  });

  it("sitemap leaves workshop courses to the workshop page", async () => {
    api.listCourses.mockResolvedValue([{ slug: "workshop-trai-nghiem-drone", title: "Workshop", summary: "", level: "workshop", format: "truc-tiep", durationHours: 2, tuitionVnd: null, certificateTrack: null }]);
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls).not.toContain("https://www.droneviet.vn/dao-tao/workshop-trai-nghiem-drone");
  });

  it("robots allows crawling and points to the www sitemap", () => {
    expect(robots()).toMatchObject({ sitemap: "https://www.droneviet.vn/sitemap.xml" });
  });
});

describe("English", () => {
  it("EN combo page uses English name with Vietnamese fallback", async () => {
    api.getProduct.mockResolvedValueOnce(detail({ ...comboQuocTe, nameEn: "International Class Kit", summaryEn: null, summary: "Trọn bộ drone" }));
    const view = render(<AppProviders>{await EnComboPage({ params: Promise.resolve({ slug: comboQuocTe.slug }) })}</AppProviders>);
    expect(screen.getByRole("heading", { level: 1, name: "International Class Kit" })).toBeInTheDocument();
    expect(screen.getByText("Trọn bộ drone")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Request a quote/ })[0]).toHaveAttribute("href", "/bao-gia?san-pham=combo-lop-hoc-quoc-te");
    view.unmount();
    api.getProduct.mockResolvedValueOnce(detail({ ...comboQuocTe, nameEn: null }));
    render(<AppProviders>{await EnComboPage({ params: Promise.resolve({ slug: comboQuocTe.slug }) })}</AppProviders>);
    expect(screen.getByRole("heading", { level: 1, name: "Combo Lớp học Quốc tế" })).toBeInTheDocument();
  });
});

describe("404", () => {
  it("not-found offers links home and to the store", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Không tìm thấy trang");
    expect(screen.getByRole("link", { name: "Về trang chủ" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Xem cửa hàng" })).toHaveAttribute("href", "/cua-hang");
  });
});
