import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import PaymentResultPage from "./page";

async function renderWith(params: Record<string, string>) {
  render(<AppProviders>{await PaymentResultPage({ searchParams: Promise.resolve(params) })}</AppProviders>);
}

const savedCart = () => JSON.parse(localStorage.getItem("dv-cart-v2") ?? "[]") as unknown[];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  localStorage.setItem("dv-cart-v2", JSON.stringify([{ variantId: "v", slug: "s", name: "N", priceVnd: 1, quantity: 1, imageUrl: null }]));
});

describe("PaymentResultPage (PayOS return/cancel URL)", () => {
  it("confirms a paid PayOS payment, clears the cart and links to my orders", async () => {
    await renderWith({ code: "00", status: "PAID", orderCode: "42", cancel: "false" });

    expect(screen.getByRole("heading", { name: "Thanh toán thành công" })).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem đơn hàng của tôi" })).toHaveAttribute("href", "/tai-khoan/don-hang");
    await waitFor(() => expect(savedCart()).toHaveLength(0));
  });

  it("explains a cancelled payment, keeps the cart and offers to return to it", async () => {
    await renderWith({ status: "CANCELLED", cancel: "true", orderCode: "42" });

    expect(screen.getByRole("heading", { name: "Đã hủy thanh toán" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quay lại giỏ hàng" })).toHaveAttribute("href", "/gio-hang");
    expect(savedCart()).toHaveLength(1);
  });

  it("does not claim success when PayOS reports a pending payment", async () => {
    await renderWith({ status: "PENDING", orderCode: "42" });

    expect(screen.queryByRole("heading", { name: "Thanh toán thành công" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Đang chờ xác nhận thanh toán" })).toBeInTheDocument();
  });
});
