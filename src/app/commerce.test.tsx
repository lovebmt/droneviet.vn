import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { DEFAULT_SETTINGS } from "@/lib/api/types";
import { comboQuocTe, detail } from "@/test/fixtures";

const api = vi.hoisted(() => ({ getProduct: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
const navigate = vi.hoisted(() => ({ goTo: vi.fn() }));
vi.mock("@/lib/navigate", () => navigate);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

const { default: QuotePage } = await import("./bao-gia/page");
const { default: CartPage } = await import("./gio-hang/page");
const { default: CheckoutPage } = await import("./thanh-toan/page");

type Call = { url: string; init?: RequestInit };
let calls: Call[];
let respond: (url: string, init?: RequestInit) => Response;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function seedCart(lines = [{ variantId: "v-fleet", slug: "dv-code-fleet", name: "DV Code Fleet", priceVnd: 24_900_000, quantity: 1, imageUrl: null }]) {
  localStorage.setItem("dv-cart-v2", JSON.stringify(lines));
}

const fill = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  localStorage.clear();
  calls = [];
  respond = () => json({}, 401);
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return respond(url, init);
  }));
  navigate.goTo.mockReset();
  api.getProduct.mockResolvedValue(detail({ ...comboQuocTe }));
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
});

describe("quote form", () => {
  it("quote form prefills the product and students from the URL and posts them", async () => {
    respond = (url) => (url.endsWith("/quotes") ? json({ id: "q1" }, 201) : json({}, 401));
    render(<AppProviders>{await QuotePage({ searchParams: Promise.resolve({ "san-pham": "combo-lop-hoc-quoc-te", "hoc-sinh": "20" }) })}</AppProviders>);
    expect(screen.getByText("Combo Lớp học Quốc tế")).toBeInTheDocument();
    expect(screen.getByLabelText(/Số học sinh/)).toHaveValue(20);
    fill(/Tên trường hoặc đơn vị/, "THCS Nguyễn Du");
    fill(/Người liên hệ/, "Cô Lan");
    fill(/Số điện thoại/, "0912345678");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu báo giá" })));
    const post = calls.find((c) => c.url.endsWith("/quotes"))!;
    expect(JSON.parse(String(post.init!.body))).toMatchObject({ productSlug: "combo-lop-hoc-quoc-te", students: 20, organization: "THCS Nguyễn Du", contactName: "Cô Lan", phone: "0912345678", quantity: 1 });
    expect(await screen.findByText("Đã gửi yêu cầu báo giá")).toBeInTheDocument();
  });
});

describe("cart", () => {
  it("cart page updates quantity and total", async () => {
    seedCart();
    render(<AppProviders><CartPage /></AppProviders>);
    expect(await screen.findByText("DV Code Fleet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tăng số lượng DV Code Fleet" }));
    await waitFor(() => expect(screen.getByTestId("cart-total")).toHaveTextContent("49.800.000 ₫"));
    fireEvent.click(screen.getByRole("button", { name: "Xóa DV Code Fleet" }));
    expect(await screen.findByText("Giỏ hàng đang trống")).toBeInTheDocument();
  });
});

describe("checkout", () => {
  async function fillCheckout() {
    render(<AppProviders><CheckoutPage /></AppProviders>);
    await screen.findByLabelText(/Họ và tên/);
    fill(/Họ và tên/, "Nguyễn An");
    fill(/Số điện thoại/, "0912345678");
    fill(/Địa chỉ giao hàng/, "12 Lê Lợi, Huế");
  }

  it("checkout with an empty cart shows a message instead of the form", async () => {
    render(<AppProviders><CheckoutPage /></AppProviders>);
    expect(await screen.findByText("Giỏ hàng đang trống")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đặt hàng/ })).not.toBeInTheDocument();
  });

  it("checkout keeps the cart and shows the API error", async () => {
    seedCart();
    respond = (url) => (url.endsWith("/orders") ? json({ message: "Sản phẩm không đủ hàng" }, 409) : json({}, 401));
    await fillCheckout();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Đặt hàng/ })));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sản phẩm không đủ hàng");
    expect(JSON.parse(localStorage.getItem("dv-cart-v2")!)).toHaveLength(1);
  });

  it("PayOS checkout redirects to the payment URL", async () => {
    seedCart();
    respond = (url) => (url.endsWith("/orders") ? json({ order: { orderNumber: "DV-1" }, checkoutUrl: "https://pay.payos.vn/web/abc" }, 201) : json({}, 401));
    await fillCheckout();
    fireEvent.click(screen.getByLabelText(/PayOS/));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Đặt hàng/ })));
    await waitFor(() => expect(navigate.goTo).toHaveBeenCalledWith("https://pay.payos.vn/web/abc"));
    const body = JSON.parse(String(calls.find((c) => c.url.endsWith("/orders"))!.init!.body));
    expect(body).toMatchObject({ paymentMethod: "payos", contactName: "Nguyễn An", lines: [{ variantId: "v-fleet", quantity: 1 }] });
  });

  it("COD checkout shows the order number and clears the cart", async () => {
    seedCart();
    respond = (url) => (url.endsWith("/orders") ? json({ order: { orderNumber: "DV-2" } }, 201) : json({}, 401));
    await fillCheckout();
    fireEvent.click(screen.getByLabelText(/Thanh toán khi nhận hàng/));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Đặt hàng/ })));
    expect(await screen.findByText(/DV-2/)).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("dv-cart-v2") ?? "[]")).toHaveLength(0));
  });
});
