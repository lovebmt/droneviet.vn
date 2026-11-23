"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api/client";
import { formatDate, formatVnd } from "@/lib/format";
import { ORDER_STATUS } from "@/content/orders";
import { Field, FormError, Input } from "./field";

type Found = { orderNumber: string; status: string; totalVnd: number; createdAt: string };

/** Guest order lookup by order number + the phone used at checkout. */
export function OrderLookup() {
  const [order, setOrder] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = String(form.get("orderNumber") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      setOrder(await apiFetch<Found>(`/orders/${encodeURIComponent(number)}?phone=${encodeURIComponent(phone)}`));
    } catch (e) {
      setError(e instanceof ApiError && (e.status === 404 || e.status === 400) ? "Không tìm thấy đơn với mã và số điện thoại này." : "Chưa tra cứu được. Thử lại sau ít phút.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Mã đơn hàng"><Input name="orderNumber" required placeholder="DV-…" /></Field>
        <Field label="Số điện thoại đặt hàng"><Input name="phone" type="tel" required inputMode="tel" autoComplete="tel" /></Field>
        <Button type="submit" size="lg" disabled={busy}>Tra cứu</Button>
      </form>
      <FormError message={error} />
      {order ? (
        <div role="status" className="rounded-2xl bg-white p-5">
          <p className="font-semibold">Đơn {order.orderNumber}</p>
          <p className="mt-1">Trạng thái: <strong>{ORDER_STATUS[order.status] ?? order.status}</strong></p>
          <p className="text-sm text-muted">Đặt ngày {formatDate(order.createdAt)}, tổng {formatVnd(order.totalVnd)}</p>
        </div>
      ) : null}
    </div>
  );
}
