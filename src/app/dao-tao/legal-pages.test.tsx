import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import type { Article } from "@/lib/api/types";
import { DEFAULT_SETTINGS } from "@/lib/api/types";
import { article } from "@/test/fixtures";

const api = vi.hoisted(() => ({ getArticle: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);

const { default: LicencePage } = await import("./chung-chi/page");
const { default: PermitPage } = await import("./cap-phep/page");
const { default: RegulationsPage } = await import("./quy-dinh/page");
const { default: SafetyPage } = await import("../bay-an-toan/page");

const legal = (slug: string, body: string): Article => ({
  ...article({ slug, title: "Bài pháp lý", kind: "phap-ly", tags: ["phap-ly"], levels: [] }),
  bodyMarkdown: body,
  attachments: [],
  relatedProducts: [],
  seoTitle: null,
  seoDescription: null,
});

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  api.getArticle.mockReset().mockImplementation(async (slug: string) => legal(slug, "## Ai cần giấy phép\n\nDrone từ 0,25 kg trở lên."));
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
});

const hrefs = () => screen.getAllByRole("link").map((a) => a.getAttribute("href"));

describe("legal pages under training", () => {
  it("licence page renders the article body under the certificate steps", async () => {
    render(<AppProviders>{await LicencePage()}</AppProviders>);
    expect(api.getArticle).toHaveBeenCalledWith("giay-phep-dieu-khien-drone");
    expect(screen.getByRole("heading", { level: 1, name: "Chứng chỉ, giấy phép bay" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ai cần giấy phép" })).toBeInTheDocument();
    expect(screen.getByText("Luyện bay mô phỏng")).toBeInTheDocument();
  });

  it("licence steps say practice for Hạng B is done at a training facility", async () => {
    render(<AppProviders>{await LicencePage()}</AppProviders>);
    const step = screen.getByRole("heading", { name: "Thực hành bay có hướng dẫn" }).closest("li")!;
    expect(step).toHaveTextContent("cơ sở đào tạo");
    expect(step).not.toHaveTextContent("Khóa học Drone Việt");
  });

  it("renders the frame when the article is missing", async () => {
    api.getArticle.mockResolvedValue(null);
    render(<AppProviders>{await PermitPage()}</AppProviders>);
    expect(api.getArticle).toHaveBeenCalledWith("cap-phep-bay-drone");
    expect(screen.getByRole("heading", { level: 1, name: "Cấp phép bay" })).toBeInTheDocument();
    expect(screen.getByText(/Nội dung chi tiết đang cập nhật/)).toBeInTheDocument();
    expect(hrefs()).toContain(`https://zalo.me/${DEFAULT_SETTINGS.contact.zalo}`);
  });

  it("each legal page links to the other legal pages and the map", async () => {
    render(<AppProviders>{await RegulationsPage()}</AppProviders>);
    expect(api.getArticle).toHaveBeenCalledWith("quy-dinh-phap-ly-drone");
    for (const href of ["/dao-tao/chung-chi", "/dao-tao/cap-phep", "/dao-tao/ban-do"]) expect(hrefs()).toContain(href);
  });

  it("safety page links to the legal pages", async () => {
    render(<AppProviders><SafetyPage /></AppProviders>);
    for (const href of ["/dao-tao/chung-chi", "/dao-tao/cap-phep", "/dao-tao/quy-dinh", "/dao-tao/ban-do"]) expect(hrefs()).toContain(href);
  });
});
