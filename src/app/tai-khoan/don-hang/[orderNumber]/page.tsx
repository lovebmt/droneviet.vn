"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireSession } from "@/components/account/require-session";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS } from "@/content/orders";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { MyOrder } from "@/lib/api/types";
import { formatDate, formatVnd } from "@/lib/format";

type Detail = MyOrder & { paymentMethod: string; subtotalVnd: number; discountVnd: number; shippingAddress: string | null; contactName: string; contactPhone: string };
const PAYMENT: Record<string, string> = { payos: "PayOS", cod: "Thanh toán khi nhận hàng", bank_transfer: "Chuyển khoản" };

function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    apiFetch<Detail>(`/me/orders/${encodeURIComponent(orderNumber)}`).then(setOrder, (e) =>
      setError(e instanceof ApiError && e.status === 404 ? "Không tìm thấy đơn hàng này trong tài khoản của bạn." : "Chưa tải được đơn hàng."),
    );
  }, [orderNumber]);

  if (error) return <p role="alert">{error} <Link href="/tai-khoan/don-hang" className="font-semibold text-sky-ink underline">Về danh sách đơn</Link></p>;
  if (!order) return <p className="text-muted">Đang tải đơn hàng…</p>;
  return (
    <div>
      <Link href="/tai-khoan/don-hang" className="text-sm text-muted hover:text-ink">Tất cả đơn hàng</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-light tracking-tight">Đơn {order.orderNumber}</h1>
        <Badge tone="sky">{ORDER_STATUS[order.status] ?? order.status}</Badge>
      </div>
      <p className="mt-1 text-muted">Đặt ngày {formatDate(order.createdAt)}, {PAYMENT[order.paymentMethod] ?? order.paymentMethod}</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {order.lines.map((l) => (
          <li key={l.title} className="flex justify-between gap-4 py-3"><span>{l.quantity} × {l.title}</span><span className="tabular-nums">{formatVnd(l.subtotalVnd)}</span></li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 text-right">
        {order.discountVnd ? <div><dt className="inline text-muted">Giảm giá: </dt><dd className="inline">-{formatVnd(order.discountVnd)}</dd></div> : null}
        <div className="text-xl font-semibold"><dt className="inline">Tổng: </dt><dd className="inline tabular-nums">{formatVnd(order.totalVnd)}</dd></div>
      </dl>
      <div className="mt-8 rounded-2xl bg-sky-50 p-5">
        <p className="font-semibold">Giao đến</p>
        <p className="mt-1">{order.contactName}, {order.contactPhone}</p>
        <p className="whitespace-pre-line text-muted">{order.shippingAddress ?? "Đang cập nhật"}</p>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  return <RequireSession>{() => <OrderDetail orderNumber={decodeURIComponent(orderNumber)} />}</RequireSession>;
}
