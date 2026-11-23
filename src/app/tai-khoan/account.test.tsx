import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { safeNextPath } from "@/lib/next-path";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/tai-khoan" }));
const navigate = vi.hoisted(() => ({ goTo: vi.fn() }));
vi.mock("@/lib/navigate", () => navigate);

const { default: AccountPage } = await import("./page");
const { default: OrdersPage } = await import("./don-hang/page");
const { default: LoginPage } = await import("../dang-nhap/page");

const user = { id: "u1", email: "an@example.com", displayName: "Nguyễn An", roles: ["customer"] };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
let routes: Record<string, () => Response>;

beforeEach(() => {
  router.replace.mockReset();
  navigate.goTo.mockReset();
  routes = {};
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const path = new URL(url).pathname + new URL(url).search;
    const hit = Object.entries(routes).find(([p]) => path === p || path.startsWith(`${p}?`));
    return hit ? hit[1]() : json({ message: "Unauthorized" }, 401);
  }));
});

describe("account", () => {
  it("account sends signed-out visitors to sign in", async () => {
    render(<AppProviders><AccountPage /></AppProviders>);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dang-nhap?tiep=%2Ftai-khoan"));
  });

  it("my orders lists orders from /me/orders", async () => {
    routes["/auth/me"] = () => json(user);
    routes["/me/orders"] = () => json([{ orderNumber: "DV-1", status: "shipped", totalVnd: 24_900_000, createdAt: "2026-11-20T03:00:00.000Z", lines: [{ title: "DV Code Fleet - Tiêu chuẩn", quantity: 1, subtotalVnd: 24_900_000 }] }]);
    render(<AppProviders><OrdersPage /></AppProviders>);
    expect(await screen.findByRole("link", { name: /DV-1/ })).toHaveAttribute("href", "/tai-khoan/don-hang/DV-1");
    expect(screen.getByText("Đang giao")).toBeInTheDocument();
  });

  it("guest lookup shows an order found by number and phone", async () => {
    routes["/orders/DV-9"] = () => json({ orderNumber: "DV-9", status: "delivered", totalVnd: 500_000, createdAt: "2026-11-01T03:00:00.000Z" });
    render(<AppProviders><OrdersPage /></AppProviders>);
    fireEvent.change(await screen.findByLabelText("Mã đơn hàng"), { target: { value: "DV-9" } });
    fireEvent.change(screen.getByLabelText("Số điện thoại đặt hàng"), { target: { value: "0912345678" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Tra cứu" })));
    expect(await screen.findByText("Đã giao")).toBeInTheDocument();
  });
});

describe("staff shortcut", () => {
  it("staff see a link to the admin, customers do not", async () => {
    routes["/auth/me"] = () => json({ ...user, roles: ["operations"] });
    const view = render(<AppProviders><AccountPage /></AppProviders>);
    expect(await screen.findByRole("link", { name: "Quản trị" })).toHaveAttribute("href", "/admin");
    view.unmount();
    routes["/auth/me"] = () => json(user);
    render(<AppProviders><AccountPage /></AppProviders>);
    await screen.findByText(user.email);
    expect(screen.queryByRole("link", { name: "Quản trị" })).not.toBeInTheDocument();
  });
});

describe("sign-in return path", () => {
  it("safeNextPath keeps same-site paths only", () => {
    expect(safeNextPath("/tai-khoan/don-hang")).toBe("/tai-khoan/don-hang");
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
  });

  it("sign-in returns to the tiep path but ignores external URLs", async () => {
    routes["/auth/providers"] = () => json({ google: false, zalo: false });
    routes["/auth/login"] = () => json({ accessToken: "t", user: { id: "u1", email: user.email, roles: [] } });
    const signIn = async (tiep: string) => {
      const view = render(<AppProviders>{await LoginPage({ searchParams: Promise.resolve({ tiep }) })}</AppProviders>);
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: user.email } });
      fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "mat-khau-dai-12" } });
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" })));
      view.unmount();
    };
    await signIn("/tai-khoan/don-hang");
    expect(navigate.goTo).toHaveBeenLastCalledWith("/tai-khoan/don-hang");
    await signIn("https://evil.example/phish");
    expect(navigate.goTo).toHaveBeenLastCalledWith("/tai-khoan");
  });
});
