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

  it("header shows every main section; sections with sub-items are menus, not links", () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    for (const name of ["Giáo dục", "Cửa hàng", "Đào tạo & chứng chỉ"]) {
      const trigger = within(nav).getByRole("button", { name });
      expect(trigger).toHaveAttribute("aria-haspopup", "true");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(within(nav).queryByRole("link", { name })).not.toBeInTheDocument();
    }
    for (const [name, href] of [["R&D", "/r-d"], ["Bay mô phỏng", "/bay-mo-phong"], ["Hỗ trợ", "/ho-tro"]]) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(nav).getByRole("link", { name: "Bay mô phỏng" }).className).toContain("bg-sun");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/bao-gia");
  });

  it("a sub-menu opens on hover, closes when the pointer leaves, and its parent never navigates", () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    const trigger = within(nav).getByRole("button", { name: "Giáo dục" });
    const item = trigger.parentElement!;
    expect(within(nav).queryByRole("link", { name: /Workshop trải nghiệm/ })).not.toBeInTheDocument();

    fireEvent.mouseEnter(item);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(nav).getByRole("link", { name: /Workshop trải nghiệm/ })).toHaveAttribute("href", "/giao-duc/workshop");
    expect(within(nav).queryByRole("link", { name: /Tổng quan giáo dục/ })).not.toBeInTheDocument();

    fireEvent.click(trigger); // pressing the parent keeps the menu open and goes nowhere
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseLeave(item);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(within(nav).queryByRole("link", { name: /Workshop trải nghiệm/ })).not.toBeInTheDocument();
  });

  it("a sub-menu opens from the keyboard and closes on Escape or after choosing an item", () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    const trigger = within(nav).getByRole("button", { name: "Cửa hàng" });
    fireEvent.click(trigger); // Enter or Space on a button
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    fireEvent.click(within(nav).getByRole("link", { name: /Tất cả sản phẩm/ }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("menu items and sub-items give feedback when pressed", () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    const pressable = (el: HTMLElement) => /active:scale-/.test(el.className) && /active:bg-/.test(el.className);
    expect(pressable(within(nav).getByRole("button", { name: "Giáo dục" }))).toBe(true);
    expect(pressable(within(nav).getByRole("link", { name: "Bay mô phỏng" }))).toBe(true);
    fireEvent.mouseEnter(within(nav).getByRole("button", { name: "Giáo dục" }).parentElement!);
    expect(pressable(within(nav).getByRole("link", { name: /Workshop trải nghiệm/ }))).toBe(true);
    expect(pressable(screen.getByRole("link", { name: /Giỏ hàng/ }))).toBe(true);

    act(() => screen.getByRole("button", { name: "Mở menu" }).click());
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(pressable(within(dialog).getByRole("link", { name: "Combo lớp học" }))).toBe(true);
    expect(pressable(within(dialog).getByRole("link", { name: "Cấp phép bay" }))).toBe(true);
  });

  it("mobile menu shows section names as headings and only sub-items as links", () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    act(() => screen.getByRole("button", { name: "Mở menu" }).click());
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(within(dialog).queryByRole("link", { name: "Giáo dục" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Giáo dục")).toBeInTheDocument();
    expect(within(dialog).queryByRole("link", { name: "Tổng quan giáo dục" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Tiểu học" })).toHaveAttribute("href", "/giao-duc/tieu-hoc");
    expect(within(dialog).getByRole("link", { name: "Bay mô phỏng" })).toHaveAttribute("href", "/bay-mo-phong");
  });

  it("cart icon shows the item count", async () => {
    signedOut();
    localStorage.setItem("dv-cart-v2", JSON.stringify([{ variantId: "v1", slug: "a", name: "A", priceVnd: 1, quantity: 3, imageUrl: null }]));
    render(<AppProviders><SiteHeader /></AppProviders>);
    await waitFor(() => expect(screen.getByRole("link", { name: "Giỏ hàng, 3 sản phẩm" })).toHaveAttribute("href", "/gio-hang"));
  });

  it("account icon points to sign-in when signed out", async () => {
    signedOut();
    render(<AppProviders><SiteHeader /></AppProviders>);
    await waitFor(() => expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/dang-nhap"));
    expect(screen.queryByRole("button", { name: "Tài khoản của tôi" })).not.toBeInTheDocument();
  });

  function signedIn(roles: string[] = ["customer"]) {
    const calls: Array<{ path: string; method: string }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      calls.push({ path, method: init?.method ?? "GET" });
      return path === "/auth/me" ? Response.json({ id: "u", email: "an@example.com", displayName: "Nguyễn An", roles }) : Response.json({ ok: true });
    }));
    return calls;
  }

  it("signed in, the account icon opens a menu with profile, orders, courses and sign-out", async () => {
    signedIn();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const trigger = await screen.findByRole("button", { name: "Tài khoản của tôi" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Hồ sơ" })).not.toBeInTheDocument();

    fireEvent.mouseEnter(trigger.parentElement!);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region", { name: "Tài khoản" });
    expect(within(panel).getByText("Nguyễn An")).toBeInTheDocument();
    expect(within(panel).getByText("an@example.com")).toBeInTheDocument();
    for (const [name, href] of [["Hồ sơ", "/tai-khoan"], ["Đơn hàng của tôi", "/tai-khoan/don-hang"], ["Khóa học của tôi", "/tai-khoan/khoa-hoc"]]) {
      expect(within(panel).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(panel).queryByRole("link", { name: "Quản trị" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();

    fireEvent.mouseLeave(trigger.parentElement!);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("the account menu opens on click or touch and closes on Escape or a click outside", async () => {
    signedIn();
    render(<AppProviders><SiteHeader /></AppProviders>);
    const trigger = await screen.findByRole("button", { name: "Tài khoản của tôi" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("staff see Quản trị in the account menu", async () => {
    signedIn(["operations"]);
    render(<AppProviders><SiteHeader /></AppProviders>);
    fireEvent.click(await screen.findByRole("button", { name: "Tài khoản của tôi" }));
    expect(screen.getByRole("link", { name: "Quản trị" })).toHaveAttribute("href", "/admin");
  });

  it("Đăng xuất signs out from the account menu", async () => {
    const calls = signedIn();
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    render(<AppProviders><SiteHeader /></AppProviders>);
    fireEvent.click(await screen.findByRole("button", { name: "Tài khoản của tôi" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Đăng xuất" })));
    expect(calls).toContainEqual({ path: "/auth/logout", method: "POST" });
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
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
    expect(within(dialog).queryByRole("link", { name: "Khóa học" })).not.toBeInTheDocument();
    for (const [name, href] of [["Chứng chỉ, giấy phép bay", "/dao-tao/chung-chi"], ["Cấp phép bay", "/dao-tao/cap-phep"], ["Quy định pháp lý", "/dao-tao/quy-dinh"], ["Bản đồ khu vực bay", "/dao-tao/ban-do"]]) {
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

  it("footer has no link to the removed course list", () => {
    render(<AppProviders><SiteFooter settings={DEFAULT_SETTINGS} /></AppProviders>);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).queryByRole("link", { name: "Khóa học" })).not.toBeInTheDocument();
    expect(within(footer).queryAllByRole("link").some((a) => a.getAttribute("href") === "/dao-tao")).toBe(false);
  });

  it("footer links legal pages", () => {
    render(<SiteFooter settings={DEFAULT_SETTINGS} />);
    expect(screen.getByRole("link", { name: "Chính sách bảo mật" })).toHaveAttribute("href", "/chinh-sach-bao-mat");
    expect(screen.getByRole("link", { name: "Điều khoản sử dụng" })).toHaveAttribute("href", "/dieu-khoan-su-dung");
  });
});
