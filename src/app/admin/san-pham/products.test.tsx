import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUserContext } from "@/components/admin/admin-context";
import { faqFromText, faqToText, specsFromText, specsToText } from "@/components/admin/text-formats";
import { AppProviders } from "@/components/providers/app-providers";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/admin/san-pham", useParams: () => ({ id: "c0" }) }));
const { ProductEditor } = await import("@/components/admin/product-editor");

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const admin = { id: "a", email: "a@x.vn", displayName: "Admin", roles: ["super_admin"] };

const base = {
  id: "c0", slug: "combo-tieu-hoc", name: "Combo Tiểu học", nameEn: null, summary: "s", summaryEn: null, kind: "combo", status: "published",
  coverImageUrl: null, levels: ["tieu-hoc"], gallery: [], specs: [], inTheBox: [], faq: [], compatibleWith: [], brochureUrl: null,
  seoTitle: null, seoDescription: null, badge: null, sortOrder: 0, featured: false,
  variants: [{ id: "v1", sku: "CB-1", title: "Tiêu chuẩn", priceVnd: 1000, compareAtVnd: null, purchaseMode: "quote_only", isActive: true, inventory: { onHand: 2, reserved: 0 } }],
  comboItems: [{ productSlug: "dv-code-fleet", productName: "DV Code Fleet", quantity: 2, note: null }],
  sizeTiers: [],
};

let calls: Array<{ method: string; path: string; body: unknown }>;
let respond: (method: string, path: string) => Response | undefined;

beforeEach(() => {
  calls = [];
  respond = () => undefined;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    calls.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const custom = respond(method, path);
    if (custom) return custom;
    if (path === "/admin/catalog/products/c0") return json(base);
    if (path === "/admin/catalog/products") return json([base, { ...base, id: "p1", slug: "dv-code-fleet", name: "DV Code Fleet", kind: "drone" }]);
    return json({ ok: true });
  }));
});

function renderEditor() {
  return render(<AppProviders><AdminUserContext.Provider value={admin}><ProductEditor id="c0" /></AdminUserContext.Provider></AppProviders>);
}

describe("text formats", () => {
  it("specs round-trip through the text format", () => {
    const specs = [{ group: "Khung", items: [{ label: "Trọng lượng", value: "250 g" }, { label: "Kích thước", value: "20 × 20 cm" }] }];
    expect(specsFromText(specsToText(specs))).toEqual(specs);
    expect(specsFromText("Pin: 2S\n## Bay\nThời gian: 8 phút")).toEqual([
      { group: "Thông tin chính", items: [{ label: "Pin", value: "2S" }] },
      { group: "Bay", items: [{ label: "Thời gian", value: "8 phút" }] },
    ]);
  });

  it("faq round-trips through the text format", () => {
    const faq = [{ q: "Bảo hành?", a: "12 tháng" }, { q: "Giao hàng?", a: "Toàn quốc" }];
    expect(faqFromText(faqToText(faq))).toEqual(faq);
  });
});

describe("product editor", () => {
  it("saving a variant sends price and stock", async () => {
    renderEditor();
    const row = await screen.findByRole("group", { name: /Phiên bản Tiêu chuẩn/ });
    fireEvent.change(within(row).getByLabelText("Giá (₫)"), { target: { value: "2500000" } });
    fireEvent.change(within(row).getByLabelText("Tồn kho"), { target: { value: "7" } });
    await act(async () => fireEvent.click(within(row).getByRole("button", { name: "Lưu phiên bản" })));
    expect(calls.find((c) => c.method === "PATCH" && c.path === "/admin/catalog/variants/v1")?.body).toMatchObject({ priceVnd: 2_500_000, stock: 7 });
    expect(await within(row).findByText("Đã lưu")).toBeInTheDocument();
  });

  it("API 400 shows the message and keeps the input", async () => {
    respond = (method, path) => (method === "PATCH" && path === "/admin/catalog/products/c0" ? json({ message: ["name must be a string"] }, 400) : undefined);
    renderEditor();
    const name = await screen.findByLabelText(/Tên sản phẩm/);
    fireEvent.change(name, { target: { value: "Combo mới" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" })));
    expect(await screen.findByRole("alert")).toHaveTextContent("name must be a string");
    expect(screen.getByLabelText(/Tên sản phẩm/)).toHaveValue("Combo mới");
  });

  it("combo editor sends items and tiers", async () => {
    renderEditor();
    const combo = await screen.findByRole("region", { name: "Thành phần combo" });
    fireEvent.change(within(combo).getByLabelText("Số lượng DV Code Fleet"), { target: { value: "4" } });
    fireEvent.click(within(combo).getByRole("button", { name: "Thêm bậc giá" }));
    fireEvent.change(within(combo).getByLabelText("Số học sinh bậc 1"), { target: { value: "20" } });
    fireEvent.change(within(combo).getByLabelText("Giá bậc 1 (₫)"), { target: { value: "150000000" } });
    await act(async () => fireEvent.click(within(combo).getByRole("button", { name: "Lưu combo" })));
    expect(calls.find((c) => c.path === "/admin/catalog/products/c0/combo-items")?.body).toEqual({ items: [{ productSlug: "dv-code-fleet", quantity: 4, note: null }] });
    expect(calls.find((c) => c.path === "/admin/catalog/products/c0/size-tiers")?.body).toEqual({ tiers: [{ students: 20, priceVnd: 150_000_000, label: null }] });
  });
});
