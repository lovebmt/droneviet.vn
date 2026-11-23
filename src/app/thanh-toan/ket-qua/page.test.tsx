import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaymentResultPage from "./page";

async function renderWith(params: Record<string, string>) {
  render(await PaymentResultPage({ searchParams: Promise.resolve(params) }));
}

describe("PaymentResultPage (PayOS return/cancel URL)", () => {
  it("confirms a paid PayOS payment and links to order tracking", async () => {
    await renderWith({ code: "00", status: "PAID", orderCode: "42", cancel: "false" });

    expect(screen.getByRole("heading", { name: "Thanh toán thành công" })).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Theo dõi đơn hàng" })).toHaveAttribute("href", "/theo-doi-don");
  });

  it("explains a cancelled payment and offers to return to the cart", async () => {
    await renderWith({ status: "CANCELLED", cancel: "true", orderCode: "42" });

    expect(screen.getByRole("heading", { name: "Đã hủy thanh toán" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quay lại giỏ hàng" })).toHaveAttribute("href", "/gio-hang");
  });

  it("does not claim success when PayOS reports a pending payment", async () => {
    await renderWith({ status: "PENDING", orderCode: "42" });

    expect(screen.queryByRole("heading", { name: "Thanh toán thành công" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Đang chờ xác nhận thanh toán" })).toBeInTheDocument();
  });
});
