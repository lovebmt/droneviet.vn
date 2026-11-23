"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Field, FormError, Input, Textarea } from "@/components/forms/field";
import { useCart } from "@/components/providers/cart-provider";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api/client";
import { formatVnd } from "@/lib/format";
import { goTo } from "@/lib/navigate";
import { EmptyCart } from "./empty-cart";

const METHODS = [
  { value: "payos", label: "Thanh toán online qua PayOS", hint: "Quét QR ngân hàng, xác nhận ngay." },
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng", hint: "Drone Việt gửi thông tin chuyển khoản sau khi xác nhận đơn." },
  { value: "cod", label: "Thanh toán khi nhận hàng (COD)", hint: "Trả tiền mặt cho đơn vị giao hàng." },
] as const;

type CreateOrderResponse = { order: { orderNumber: string }; checkoutUrl?: string };

export function CheckoutForm() {
  const { lines, totalVnd, ready, clear } = useCart();
  const { user, status } = useSession();
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("payos");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);

  if (placed) {
    return (
      <div role="status" className="rounded-2xl bg-sky-50 p-8">
        <CheckCircle2 size={32} strokeWidth={1.75} className="text-teal-ink" aria-hidden="true" />
        <h2 className="mt-3 text-2xl font-semibold">Đã đặt hàng</h2>
        <p className="mt-2">Mã đơn hàng của bạn: <strong className="tabular-nums">{placed}</strong></p>
        <p className="mt-1 text-muted">Drone Việt sẽ gọi xác nhận đơn trong giờ hành chính. Hãy lưu lại mã đơn để tra cứu.</p>
        <Link href={status === "signed-in" ? "/tai-khoan/don-hang" : "/cua-hang"} className="mt-6 inline-block font-semibold text-sky-ink underline underline-offset-4">
          {status === "signed-in" ? "Xem đơn hàng của tôi" : "Tiếp tục mua sắm"}
        </Link>
      </div>
    );
  }
  if (!ready) return <p className="text-muted">Đang tải giỏ hàng…</p>;
  if (!lines.length) return <EmptyCart />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    setSending(true);
    setError(null);
    try {
      const result = await apiFetch<CreateOrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          contactName: text("contactName"),
          contactPhone: text("contactPhone"),
          contactEmail: text("contactEmail") || undefined,
          shippingAddress: [text("shippingAddress"), text("note") && `Ghi chú: ${text("note")}`].filter(Boolean).join("\n"),
          paymentMethod: method,
          lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        }),
      });
      if (result.checkoutUrl) {
        // The cart is cleared on the payment result page once PayOS reports PAID.
        goTo(result.checkoutUrl);
        return;
      }
      clear();
      setPlaced(result.order.orderNumber);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 400
            ? `Thông tin chưa hợp lệ: ${e.message}`
            : e.message
          : "Không kết nối được máy chủ. Giỏ hàng vẫn được giữ, hãy thử lại.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-10">
        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-4 text-xl font-semibold">Thông tin nhận hàng</legend>
          <Field label="Họ và tên" required>
            <Input name="contactName" required autoComplete="name" defaultValue={user?.displayName ?? ""} />
          </Field>
          <Field label="Số điện thoại" required>
            <Input name="contactPhone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0912345678" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email" hint="Nhận xác nhận đơn hàng qua email">
              <Input name="contactEmail" type="email" autoComplete="email" defaultValue={user?.email ?? ""} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Địa chỉ giao hàng" required>
              <Textarea name="shippingAddress" required rows={2} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, tỉnh/thành" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Ghi chú">
              <Input name="note" placeholder="Ví dụ: giao giờ hành chính" />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-4 text-xl font-semibold">Thanh toán</legend>
          <div className="space-y-3">
            {METHODS.map((m) => (
              <label key={m.value} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${method === m.value ? "border-sky bg-sky-50" : "border-line"}`}>
                <input type="radio" name="paymentMethod" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="mt-1 accent-[#0B6FE0]" />
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="block text-sm text-muted">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit space-y-5 rounded-2xl bg-sky-50 p-6">
        <h2 className="text-lg font-semibold">Đơn hàng</h2>
        <ul className="space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between gap-3">
              <span>{l.quantity} × {l.name}</span>
              <span className="tabular-nums">{formatVnd(l.priceVnd * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-muted">Tạm tính</span>
          <span className="text-2xl font-semibold tabular-nums">{formatVnd(totalVnd)}</span>
        </div>
        <FormError message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={sending}>
          {sending ? "Đang đặt hàng…" : method === "payos" ? "Đặt hàng và thanh toán" : "Đặt hàng"}
        </Button>
        <p className="text-xs text-muted">
          Bằng việc đặt hàng, bạn đồng ý với <Link href="/dieu-khoan-su-dung" className="underline">điều khoản sử dụng</Link>.
        </p>
      </aside>
    </form>
  );
}
