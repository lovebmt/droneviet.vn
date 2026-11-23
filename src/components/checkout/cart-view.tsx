"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { ProductImage } from "@/components/catalog/product-image";
import { useCart } from "@/components/providers/cart-provider";
import { LinkButton } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import { EmptyCart } from "./empty-cart";
import { QuantityStepper } from "./quantity-stepper";

export function CartView() {
  const { lines, totalVnd, ready, setQuantity, remove } = useCart();
  if (!ready) return <p className="text-muted">Đang tải giỏ hàng…</p>;
  if (!lines.length) return <EmptyCart />;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((line) => (
          <li key={line.variantId} className="flex gap-4 py-5">
            <ProductImage src={line.imageUrl} alt={line.name} sizes="112px" className="h-24 w-28 shrink-0 bg-sky-50" />
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/cua-hang/${line.slug}`} className="font-semibold hover:text-sky">{line.name}</Link>
                <p className="text-sm text-muted">{formatVnd(line.priceVnd)}</p>
              </div>
              <div className="flex items-center gap-3">
                <QuantityStepper name={line.name} quantity={line.quantity} onChange={(q) => setQuantity(line.variantId, q)} />
                <span className="w-32 text-right font-semibold tabular-nums">{formatVnd(line.priceVnd * line.quantity)}</span>
                <button type="button" onClick={() => remove(line.variantId)} aria-label={`Xóa ${line.name}`} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-sky-50 hover:text-ink">
                  <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-2xl bg-sky-50 p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Tạm tính</span>
          <span data-testid="cart-total" className="text-2xl font-semibold tabular-nums">{formatVnd(totalVnd)}</span>
        </div>
        <p className="mt-2 text-sm text-muted">Phí giao hàng và tồn kho được xác nhận khi đặt hàng.</p>
        <LinkButton href="/thanh-toan" size="lg" className="mt-6 w-full">Tiến hành đặt hàng</LinkButton>
        <Link href="/cua-hang" className="mt-4 block text-center text-sm font-semibold text-sky hover:underline underline-offset-4">Tiếp tục mua sắm</Link>
      </aside>
    </div>
  );
}
