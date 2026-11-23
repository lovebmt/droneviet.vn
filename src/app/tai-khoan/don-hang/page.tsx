"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderLookup } from "@/components/forms/order-lookup";
import { EmptyState } from "@/components/page/empty-state";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS } from "@/content/orders";
import { apiFetch } from "@/lib/api/client";
import type { MyOrder } from "@/lib/api/types";
import { formatDate, formatVnd } from "@/lib/format";

/** Signed-in customers see their orders; anyone can look up an order by number and phone. */
export default function OrdersPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (status !== "signed-in") return;
    apiFetch<MyOrder[]>("/me/orders").then(setOrders, () => setFailed(true));
  }, [status]);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-4xl font-light tracking-tight">Đơn hàng</h1>
        {status === "loading" ? <p className="mt-6 text-muted">Đang tải…</p> : null}
        {status === "signed-out" ? (
          <p className="mt-4 text-muted">
            <Link href="/dang-nhap?tiep=%2Ftai-khoan%2Fdon-hang" className="font-semibold text-sky underline underline-offset-4">Đăng nhập</Link> để xem tất cả đơn hàng của bạn, hoặc tra cứu nhanh bên dưới.
          </p>
        ) : null}
        {status === "signed-in" ? (
          failed ? (
            <p role="alert" className="mt-6 text-red-800">Chưa tải được đơn hàng. Thử tải lại trang.</p>
          ) : orders === null ? (
            <p className="mt-6 text-muted">Đang tải đơn hàng…</p>
          ) : orders.length ? (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {orders.map((o) => (
                <li key={o.orderNumber} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link href={`/tai-khoan/don-hang/${encodeURIComponent(o.orderNumber)}`} className="font-semibold hover:text-sky">Đơn {o.orderNumber}</Link>
                    <p className="text-sm text-muted">{formatDate(o.createdAt)}, {o.lines.reduce((n, l) => n + l.quantity, 0)} sản phẩm</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge tone="sky">{ORDER_STATUS[o.status] ?? o.status}</Badge>
                    <span className="font-semibold tabular-nums">{formatVnd(o.totalVnd)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6"><EmptyState title="Bạn chưa có đơn hàng nào"><Link href="/cua-hang" className="font-semibold text-sky underline underline-offset-4">Xem cửa hàng</Link></EmptyState></div>
          )
        ) : null}
      </section>
      {status !== "loading" ? (
        <section className="rounded-2xl bg-sky-50 p-6">
          <h2 className="text-xl font-semibold">Tra cứu đơn bằng mã và số điện thoại</h2>
          <div className="mt-4"><OrderLookup /></div>
        </section>
      ) : null}
    </div>
  );
}
