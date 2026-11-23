"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { Button, LinkButton } from "@/components/ui/button";
import type { ProductCard } from "@/lib/api/types";

/**
 * One action per purchase mode (spec §5.3): combos and quote-only → quote form, preorder → quote form,
 * checkout → cart (disabled "Hết hàng" when sold out). Without a variant the card links to the product.
 */
export function PurchaseButton({
  product,
  variantId,
  priceVnd,
  size = "md",
}: {
  product: ProductCard;
  variantId?: string;
  priceVnd?: number;
  size?: "md" | "lg";
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const quoteHref = `/bao-gia?san-pham=${encodeURIComponent(product.slug)}`;

  if (product.kind === "combo" || product.purchaseMode === "quote_only") {
    return <LinkButton href={quoteHref} size={size}>Nhận báo giá</LinkButton>;
  }
  if (product.purchaseMode === "preorder") {
    return <LinkButton href={quoteHref} size={size} variant="secondary">Đặt trước</LinkButton>;
  }
  if (!variantId) {
    return <LinkButton href={`/cua-hang/${product.slug}`} size={size}>Chọn mua</LinkButton>;
  }
  if (!product.inStock) {
    return <Button size={size} disabled>Hết hàng</Button>;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <Button
        size={size}
        onClick={() => {
          add({ variantId, slug: product.slug, name: product.name, priceVnd: priceVnd ?? product.fromPriceVnd ?? 0, quantity: 1, imageUrl: product.coverImageUrl });
          setAdded(true);
        }}
      >
        Thêm vào giỏ
      </Button>
      {added ? (
        <span role="status" className="inline-flex items-center gap-1 text-sm text-teal-ink">
          <Check size={16} strokeWidth={2} aria-hidden="true" /> Đã thêm.{" "}
          <Link href="/gio-hang" className="font-semibold underline underline-offset-4">Xem giỏ hàng</Link>
        </span>
      ) : null}
    </span>
  );
}
