import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { DEFAULT_SETTINGS } from "@/lib/api/types";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

function signedOut() {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
}

describe("SiteHeader", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("header links every main section with the simulator highlighted", () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    for (const [name, href] of [
      ["Giáo dục", "/giao-duc"],
      ["Cửa hàng", "/cua-hang"],
      ["Đào tạo & chứng chỉ", "/dao-tao"],
      ["R&D", "/r-d"],
      ["Bay mô phỏng", "/bay-mo-phong"],
      ["Hỗ trợ", "/ho-tro"],
    ]) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(nav).getByRole("link", { name: "Bay mô phỏng" }).className).toContain("bg-sun");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/bao-gia");
  });

  it("cart icon shows the item count", async () => {
    signedOut();
    localStorage.setItem("dv-cart-v2", JSON.stringify([{ variantId: "v1", slug: "a", name: "A", priceVnd: 1, quantity: 3, imageUrl: null }]));
    render(<AppProviders><SiteHeader /></AppProviders>);
    await waitFor(() => expect(screen.getByRole("link", { name: "Giỏ hàng, 3 sản phẩm" })).toHaveAttribute("href", "/gio-hang"));
  });

  it("account icon points to sign-in when signed out and to the account when signed in", async () => {
    signedOut();
    const first = render(<AppProviders><SiteHeader /></AppProviders>);
    await waitFor(() => expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/dang-nhap"));
    first.unmount();

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: "u", email: "a@b.c", displayName: "An", roles: [] })));
    render(<AppProviders><SiteHeader /></AppProviders>);
    await waitFor(() => expect(screen.getByRole("link", { name: "Tài khoản của tôi" })).toHaveAttribute("href", "/tai-khoan"));
  });

  it("mobile menu opens, lists sections and closes on Escape", () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const toggle = screen.getByRole("button", { name: "Mở menu" });
    expect(toggle.className).toContain("lg:hidden");
    expect(screen.getByRole("navigation", { name: "Điều hướng chính" }).className).toMatch(/hidden.*lg:flex/);

    act(() => toggle.click());
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    // Rendered into <body>: inside the blurred sticky header, position:fixed would be trapped in the header box.
    expect(dialog.parentElement).toBe(document.body);
    expect(within(dialog).getByRole("link", { name: "Combo lớp học" })).toHaveAttribute("href", "/cua-hang?loai=combo");
    expect(within(dialog).getByRole("link", { name: "Workshop trải nghiệm" })).toHaveAttribute("href", "/giao-duc/workshop");
    for (const [name, href] of [["Khóa học", "/dao-tao"], ["Chứng chỉ, giấy phép bay", "/dao-tao/chung-chi"], ["Cấp phép bay", "/dao-tao/cap-phep"], ["Quy định pháp lý", "/dao-tao/quy-dinh"], ["Bản đồ khu vực bay", "/dao-tao/ban-do"]]) {
      expect(within(dialog).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menu" })).not.toBeInTheDocument();
  });
});

describe("SiteFooter", () => {
  it('footer shows Zalo contact and "Đang cập nhật" for missing fields', () => {
    render(<SiteFooter settings={DEFAULT_SETTINGS} />);
    expect(screen.getByRole("link", { name: "Zalo 0384070636" })).toHaveAttribute("href", "https://zalo.me/0384070636");
    expect(screen.getAllByText("Đang cập nhật").length).toBeGreaterThanOrEqual(3);
  });

  it("footer shows real contact details once set", () => {
    render(<SiteFooter settings={{ ...DEFAULT_SETTINGS, contact: { ...DEFAULT_SETTINGS.contact, email: "lienhe@droneviet.vn" } }} />);
    expect(screen.getByRole("link", { name: "lienhe@droneviet.vn" })).toHaveAttribute("href", "mailto:lienhe@droneviet.vn");
  });

  it("footer links legal pages", () => {
    render(<SiteFooter settings={DEFAULT_SETTINGS} />);
    expect(screen.getByRole("link", { name: "Chính sách bảo mật" })).toHaveAttribute("href", "/chinh-sach-bao-mat");
    expect(screen.getByRole("link", { name: "Điều khoản sử dụng" })).toHaveAttribute("href", "/dieu-khoan-su-dung");
  });
});
