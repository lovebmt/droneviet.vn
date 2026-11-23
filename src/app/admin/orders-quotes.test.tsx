import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUserContext } from "@/components/admin/admin-context";
import { AppProviders } from "@/components/providers/app-providers";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/admin" }));
const { default: OrdersPage } = await import("./don-hang/page");
const { default: QuotesPage } = await import("./bao-gia/page");

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const staff = { id: "a", email: "a@x.vn", displayName: "Ops", roles: ["super_admin"] };

const order = (status: string, paymentMethod = "cod") => ({
  id: "o1", orderNumber: "DV-AB12", status, paymentMethod, totalVnd: 2_000_000, subtotalVnd: 2_000_000, discountVnd: 0,
  contactName: "Nguyễn An", contactPhone: "0912345678", contactEmail: null, shippingAddress: "12 Lê Lợi, Huế", createdAt: "2026-11-23T03:00:00.000Z",
  lines: [{ id: "l1", title: "DV Code Fleet - Tiêu chuẩn", quantity: 1, unitPriceVnd: 2_000_000, subtotalVnd: 2_000_000 }],
});

let current: ReturnType<typeof order>;
let calls: Array<{ method: string; path: string; body: unknown }>;
let reject: boolean;

beforeEach(() => {
  current = order("pending_payment");
  calls = [];
  reject = false;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    if (path === "/admin/orders") return json([current]);
    if (path === "/admin/orders/o1/transition") {
      if (reject) return json({ message: "Order cannot transition from pending_payment to paid" }, 400);
      current = { ...current, status: body.nextStatus };
      return json(current);
    }
    if (path === "/admin/quotes") return json([{ id: "q1", organization: "THCS Nguyễn Du", contactName: "Cô Lan", phone: "0912345678", email: null, students: 30, quantity: 1, productSlug: "combo-tieu-hoc", organizationType: "school", requirements: "Lớp 6", status: "new", createdAt: "2026-11-23T03:00:00.000Z" }]);
    if (path === "/admin/quotes/q1") return json({ id: "q1", status: body.status });
    return json({}, 404);
  }));
});

const wrap = (ui: React.ReactNode) => render(<AppProviders><AdminUserContext.Provider value={staff}>{ui}</AdminUserContext.Provider></AppProviders>);

describe("admin orders", () => {
  it("order transition posts nextStatus and refreshes", async () => {
    wrap(<OrdersPage />);
    const row = await screen.findByRole("group", { name: /Đơn DV-AB12/ });
    await act(async () => fireEvent.click(within(row).getByRole("button", { name: "Xác nhận đơn COD" })));
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({ nextStatus: "paid" });
    await waitFor(() => expect(within(screen.getByRole("group", { name: /Đơn DV-AB12/ })).getByRole("button", { name: "Bắt đầu đóng gói" })).toBeInTheDocument());
  });

  it("a rejected transition shows the error", async () => {
    reject = true;
    wrap(<OrdersPage />);
    const row = await screen.findByRole("group", { name: /Đơn DV-AB12/ });
    await act(async () => fireEvent.click(within(row).getByRole("button", { name: "Xác nhận đơn COD" })));
    expect(await within(row).findByRole("alert")).toHaveTextContent("cannot transition");
  });

  it("PayOS pending orders offer no manual payment button", async () => {
    current = order("pending_payment", "payos");
    wrap(<OrdersPage />);
    const row = await screen.findByRole("group", { name: /Đơn DV-AB12/ });
    expect(within(row).queryByRole("button", { name: /Xác nhận/ })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Hủy đơn" })).not.toBeInTheDocument();
  });
});

describe("admin quotes", () => {
  it("quote status change patches the quote", async () => {
    wrap(<QuotesPage />);
    const row = await screen.findByRole("group", { name: /THCS Nguyễn Du/ });
    expect(within(row).getByRole("link", { name: /0912345678/ })).toHaveAttribute("href", "tel:0912345678");
    await act(async () => fireEvent.change(within(row).getByLabelText("Trạng thái"), { target: { value: "qualified" } }));
    expect(calls.find((c) => c.method === "PATCH")).toEqual({ method: "PATCH", path: "/admin/quotes/q1", body: { status: "qualified" } });
  });
});
