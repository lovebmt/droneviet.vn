/** Customer-facing labels for backend OrderStatus values. */
export const ORDER_STATUS: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  packing: "Đang đóng gói",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  payment_failed: "Thanh toán không thành công",
  refund_requested: "Đang xử lý hoàn tiền",
  refunded: "Đã hoàn tiền",
};
