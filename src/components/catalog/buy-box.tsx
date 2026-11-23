"use client";

import { useState } from "react";
import { formatVnd } from "@/lib/format";
import type { ProductDetail } from "@/lib/api/types";
import { PurchaseButton } from "./purchase-button";

/** Variant choice, price with compare-at, stock line and the one purchase action. */
export function BuyBox({ product }: { product: ProductDetail }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const inStock = variant ? variant.stock > 0 : product.inStock;
  const price = variant?.priceVnd ?? product.fromPriceVnd;

  return (
    <div className="space-y-5">
      <p className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-semibold">{price === null ? "Liên hệ báo giá" : formatVnd(price)}</span>
        {variant?.compareAtVnd && variant.compareAtVnd > variant.priceVnd ? (
          <s className="text-muted">{formatVnd(variant.compareAtVnd)}</s>
        ) : null}
      </p>

      {product.variants.length > 1 ? (
        <fieldset>
          <legend className="text-sm font-semibold">Phiên bản</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <label key={v.id} className={`cursor-pointer rounded-full border px-4 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky ${v.id === variantId ? "border-sky bg-sky-50 font-semibold text-sky-ink" : "border-line"}`}>
                <input type="radio" name="variant" value={v.id} checked={v.id === variantId} onChange={() => setVariantId(v.id)} className="sr-only" />
                {v.title}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {variant && product.purchaseMode === "checkout" ? (
        <p className={`text-sm font-semibold ${inStock ? "text-teal-ink" : "text-muted"}`}>
          {inStock ? `Còn ${variant.stock} sản phẩm` : "Hết hàng"}
        </p>
      ) : null}

      <PurchaseButton product={{ ...product, inStock }} variantId={variant?.id} priceVnd={variant?.priceVnd} size="lg" />
    </div>
  );
}
