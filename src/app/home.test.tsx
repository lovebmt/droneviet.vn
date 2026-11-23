import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { article, card, comboQuocTe, comboTieuHoc } from "@/test/fixtures";

const api = vi.hoisted(() => ({ listProducts: vi.fn(), listArticles: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
const { default: HomePage } = await import("./page");

async function renderHome() {
  render(<AppProviders>{await HomePage()}</AppProviders>);
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    api.listProducts.mockImplementation(async (kind: string) => (kind === "combo" ? [comboQuocTe, comboTieuHoc] : [card()]));
    api.listArticles.mockResolvedValue([article(), article({ slug: "b", title: "Giáo trình theo cấp học" })]);
  });

  it("home shows the combo hero with quote action", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { level: 1, name: "Combo Lớp học Quốc tế" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Nhận báo giá" })[0]).toHaveAttribute("href", "/bao-gia?san-pham=combo-lop-hoc-quoc-te");
  });

  it("home tiles link combos, parts, certificate path and comparison", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { name: "Combo Tiểu học" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Linh kiện & phụ kiện/ })).toHaveAttribute("href", "/cua-hang?loai=linh-kien");
    expect(screen.getByRole("link", { name: /Lộ trình chứng chỉ/ })).toHaveAttribute("href", "/dao-tao/chung-chi");
    expect(screen.getByRole("link", { name: /So sánh các combo/ })).toHaveAttribute("href", "/cua-hang/so-sanh");
    expect(screen.getByRole("link", { name: "Bay thử" })).toHaveAttribute("href", "/bay-mo-phong");
  });

  it("home lists the latest articles and the four levels", async () => {
    await renderHome();
    expect(screen.getByRole("link", { name: /Lắp ráp drone F450/ })).toHaveAttribute("href", "/r-d/lap-rap-f450");
    for (const [label, href] of [["Tiểu học", "/giao-duc/tieu-hoc"], ["THCS", "/giao-duc/thcs"], ["THPT & quốc tế", "/giao-duc/thpt"], ["Đại học & R&D", "/giao-duc/dai-hoc"]]) {
      expect(screen.getAllByRole("link", { name: new RegExp(label) }).some((l) => l.getAttribute("href") === href)).toBe(true);
    }
  });

  it("home hides the R&D section when there are no articles", async () => {
    api.listArticles.mockResolvedValue([]);
    await renderHome();
    expect(screen.queryByRole("heading", { name: "Bài viết R&D mới" })).not.toBeInTheDocument();
  });

  it("home renders with the API down", async () => {
    api.listProducts.mockResolvedValue([]);
    api.listArticles.mockResolvedValue([]);
    await renderHome();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bay thử" })).toBeInTheDocument();
  });
});
