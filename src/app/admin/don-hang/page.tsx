"use client";

import { useState } from "react";
import { Select } from "@/components/forms/field";
import { orderActions, PAYMENT_LABEL } from "@/components/admin/order-actions";
import { adminError, useAdminData } from "@/components/admin/use-admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS } from "@/content/orders";
import { apiFetch } from "@/lib/api/client";
import { formatDate, formatVnd } from "@/lib/format";

type AdminOrder = {
  id: string; orderNumber: string; status: string; paymentMethod: string; totalVnd: number; discountVnd: number;
  contactName: string; contactPhone: string; contactEmail: string | null; shippingAddress: string | null; createdAt: string;
  lines: Array<{ id: string; title: string; quantity: number; subtotalVnd: number }>;
};

const OPEN = ["pending_payment", "paid", "packing", "shipped", "refund_requested"];

function OrderRow({ order, onChanged }: { order: AdminOrder; onChanged(): void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actions = orderActions(order.status, order.paymentMethod);

  async function move(next: string) {
    let refundReference: string | undefined;
    if (next === "refunded" && order.paymentMethod === "payos") {
      refundReference = window.prompt("Mã tham chiếu hoàn tiền PayOS")?.trim();
      if (!refundReference) return;
    }
    if ((next === "cancelled" || next === "refund_requested") && !window.confirm(`${next === "cancelled" ? "Hủy" : "Yêu cầu hoàn tiền cho"} đơn ${order.orderNumber}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/orders/${order.id}/transition`, { method: "POST", body: JSON.stringify(refundReference ? { nextStatus: next, refundReference } : { nextStatus: next }) });
      onChanged();
    } catch (e) {
      setError(adminError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li>
      <fieldset aria-label={`Đơn ${order.orderNumber}`} className="rounded-2xl border border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Đơn {order.orderNumber}</p>
            <p className="text-sm text-muted">{formatDate(order.createdAt)}, {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={OPEN.includes(order.status) ? "sky" : "neutral"}>{ORDER_STATUS[order.status] ?? order.status}</Badge>
            <span className="font-semibold tabular-nums">{formatVnd(order.totalVnd)}</span>
          </div>
        </div>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <ul className="space-y-1">
            {order.lines.map((l) => <li key={l.id}>{l.quantity} × {l.title}</li>)}
          </ul>
          <div>
            <p>{order.contactName}, <a href={`tel:${order.contactPhone}`} className="font-semibold text-sky-ink">{order.contactPhone}</a></p>
            {order.contactEmail ? <p><a href={`mailto:${order.contactEmail}`} className="text-sky-ink">{order.contactEmail}</a></p> : null}
            <p className="whitespace-pre-line text-muted">{order.shippingAddress ?? "Chưa có địa chỉ"}</p>
          </div>
        </div>
        {actions.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((a) => (
              <Button key={a.next} type="button" variant={a.danger ? "ghost" : "secondary"} disabled={busy} onClick={() => void move(a.next)}>{a.label}</Button>
            ))}
          </div>
        ) : null}
        {error ? <p role="alert" className="mt-3 text-sm text-red-800">{error}</p> : null}
      </fieldset>
    </li>
  );
}

export default function AdminOrdersPage() {
  const { data, error, reload } = useAdminData<AdminOrder[]>("/admin/orders");
  const [filter, setFilter] = useState("open");
  const rows = (data ?? []).filter((o) => (filter === "all" ? true : filter === "open" ? OPEN.includes(o.status) : o.status === filter));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-light tracking-tight">Đơn hàng</h1>
        <Select aria-label="Lọc đơn" value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-0 w-auto">
          <option value="open">Cần xử lý</option>
          <option value="all">Tất cả</option>
          {Object.entries(ORDER_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      {error ? <p role="alert" className="mt-6">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-muted">Đang tải…</p> : null}
      {data ? (
        rows.length ? (
          <ul className="mt-6 space-y-3">{rows.map((o) => <OrderRow key={o.id} order={o} onChanged={reload} />)}</ul>
        ) : <p className="mt-6 text-muted">Không có đơn nào trong mục này.</p>
      ) : null}
    </div>
  );
}
