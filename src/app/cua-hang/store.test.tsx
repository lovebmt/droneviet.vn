import { act, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { DEFAULT_SETTINGS } from "@/lib/api/types";
import { card, comboQuocTe, comboTieuHoc, detail } from "@/test/fixtures";

const api = vi.hoisted(() => ({ listProducts: vi.fn(), getProduct: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
const nav = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("next/navigation", () => nav);

const { default: StorePage } = await import("./page");
const { default: ProductPage } = await import("./[slug]/page");
const { default: ComboPage } = await import("./combo/[slug]/page");
const { default: ComparePage } = await import("./so-sanh/page");

const params = <T,>(value: T) => Promise.resolve(value);

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  api.listProducts.mockReset().mockResolvedValue([]);
  api.getProduct.mockReset();
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
});

describe("store list", () => {
  it("store list filters by loai and always passes kind", async () => {
    api.listProducts.mockImplementation(async (kind: string) => (kind === "part" ? [card({ slug: "motor", name: "Motor 2205", kind: "part" })] : []));
    render(<AppProviders>{await StorePage({ searchParams: params({ loai: "linh-kien" }) })}</AppProviders>);
    expect(api.listProducts.mock.calls.map(([kind]) => kind).sort()).toEqual(["accessory", "part"]);
    expect(screen.getByRole("link", { name: /Motor 2205/ })).toHaveAttribute("href", "/cua-hang/motor");
  });

  it("store list without loai shows combos, drones and parts sections", async () => {
    api.listProducts.mockImplementation(async (kind: string) => (kind === "combo" ? [comboQuocTe] : kind === "drone" ? [card()] : []));
    render(<AppProviders>{await StorePage({ searchParams: params({}) })}</AppProviders>);
    expect(screen.getByRole("heading", { name: "Combo lớp học" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Drone" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Combo Lớp học Quốc tế/ })).toHaveAttribute("href", "/cua-hang/combo/combo-lop-hoc-quoc-te");
  });
});

describe("product page", () => {
  it("unknown product slug calls notFound", async () => {
    api.getProduct.mockResolvedValue(null);
    await expect(ProductPage({ params: params({ slug: "khong-co" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("a combo opened at the product URL redirects to the combo page", async () => {
    api.getProduct.mockResolvedValue(detail({ ...comboQuocTe }));
    await expect(ProductPage({ params: params({ slug: comboQuocTe.slug }) })).rejects.toThrow("NEXT_REDIRECT:/cua-hang/combo/combo-lop-hoc-quoc-te");
  });

  it("product page shows price, stock, specs and an add-to-cart button", async () => {
    api.getProduct.mockResolvedValue(detail());
    render(<AppProviders>{await ProductPage({ params: params({ slug: "dv-code-fleet" }) })}</AppProviders>);
    expect(screen.getByRole("heading", { level: 1, name: "DV Code Fleet" })).toBeInTheDocument();
    expect(screen.getAllByText("24.900.000 ₫")[0]).toBeInTheDocument();
    expect(screen.getByText("Còn 4 sản phẩm")).toBeInTheDocument();
    expect(screen.getByText("5-10 drone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm vào giỏ" })).toBeEnabled();
  });

  it("product page JSON-LD contains name and price", async () => {
    api.getProduct.mockResolvedValue(detail());
    const { container } = render(<AppProviders>{await ProductPage({ params: params({ slug: "dv-code-fleet" }) })}</AppProviders>);
    const json = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(json).toMatchObject({ "@type": "Product", name: "DV Code Fleet", offers: { price: 24_900_000, priceCurrency: "VND" } });
  });
});

describe("combo page", () => {
  it("combo without tiers hides the estimator and shows Liên hệ báo giá", async () => {
    api.getProduct.mockResolvedValue(detail({ ...comboQuocTe, comboItems: [{ product: card(), quantity: 2, note: null }], variants: [] }));
    render(<AppProviders>{await ComboPage({ params: params({ slug: comboQuocTe.slug }) })}</AppProviders>);
    expect(screen.queryByRole("group", { name: "Quy mô lớp" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Liên hệ báo giá").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Nhận tư vấn & báo giá" })[0]).toHaveAttribute("href", "/bao-gia?san-pham=combo-lop-hoc-quoc-te");
    expect(screen.getByText("2 ×")).toBeInTheDocument();
  });

  it("estimator updates the estimate and quote link when the class size changes", async () => {
    api.getProduct.mockResolvedValue(
      detail({
        ...comboQuocTe,
        fromPriceVnd: 99_000_000,
        variants: [],
        sizeTiers: [
          { students: 10, priceVnd: 99_000_000, label: null },
          { students: 20, priceVnd: 185_000_000, label: null },
        ],
      }),
    );
    render(<AppProviders>{await ComboPage({ params: params({ slug: comboQuocTe.slug }) })}</AppProviders>);
    const group = screen.getByRole("group", { name: "Quy mô lớp" });
    act(() => within(group).getByRole("button", { name: "20 học sinh" }).click());
    expect(screen.getByText("185.000.000 ₫")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Nhận tư vấn & báo giá" })[0]).toHaveAttribute("href", "/bao-gia?san-pham=combo-lop-hoc-quoc-te&hoc-sinh=20");
  });

  it("unknown or non-combo slug is 404", async () => {
    api.getProduct.mockResolvedValue(detail());
    await expect(ComboPage({ params: params({ slug: "dv-code-fleet" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("compare page", () => {
  it("compare table lists every combo", async () => {
    api.listProducts.mockResolvedValue([comboQuocTe, comboTieuHoc]);
    api.getProduct.mockImplementation(async (slug: string) =>
      detail({ ...(slug === comboTieuHoc.slug ? comboTieuHoc : comboQuocTe), comboItems: [{ product: card(), quantity: 1, note: null }] }),
    );
    render(<AppProviders>{await ComparePage()}</AppProviders>);
    const table = screen.getByRole("table");
    expect(within(table).getByText("Combo Lớp học Quốc tế")).toBeInTheDocument();
    expect(within(table).getByText("Combo Tiểu học")).toBeInTheDocument();
  });
});
