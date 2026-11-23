/** Mirrors backend order-workflow.ts so staff only see actions the API will accept. */
const NEXT: Record<string, string[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["packing", "refund_requested"],
  packing: ["shipped", "refund_requested"],
  shipped: ["delivered", "refund_requested"],
  delivered: ["refund_requested"],
  refund_requested: ["refunded"],
  payment_failed: [],
  cancelled: [],
  refunded: [],
};

const LABEL: Record<string, string> = {
  packing: "Bắt đầu đóng gói",
  shipped: "Đã giao cho vận chuyển",
  delivered: "Đã giao xong",
  cancelled: "Hủy đơn",
  refund_requested: "Yêu cầu hoàn tiền",
  refunded: "Đã hoàn tiền",
};

export interface OrderAction {
  next: string;
  label: string;
  danger: boolean;
}

/** PayOS payment states belong to the webhook; COD/bank orders are confirmed by staff. */
export function orderActions(status: string, paymentMethod: string): OrderAction[] {
  return (NEXT[status] ?? []).flatMap((next) => {
    if (next === "paid") {
      if (paymentMethod === "cod") return [{ next, label: "Xác nhận đơn COD", danger: false }];
      if (paymentMethod === "bank_transfer") return [{ next, label: "Xác nhận đã nhận chuyển khoản", danger: false }];
      return [];
    }
    if (next === "cancelled" && paymentMethod === "payos") return [];
    return [{ next, label: LABEL[next] ?? next, danger: next === "cancelled" || next.startsWith("refund") }];
  });
}

export const PAYMENT_LABEL: Record<string, string> = { payos: "PayOS", cod: "COD", bank_transfer: "Chuyển khoản" };
