import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import type { ProductCard as Card } from "@/lib/api/types";
import { ProductImage } from "./product-image";
import { levelLabels, productHref } from "./product-tile";

/** Compact grid card for listings and search. */
export function ProductCard({ product }: { product: Card }) {
  return (
    <Link href={productHref(product)} className="group flex flex-col rounded-2xl border border-line bg-white p-4 transition-colors hover:border-sky">
      <ProductImage src={product.coverImageUrl} alt={product.name} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw" className="aspect-[4/3] w-full" />
      <div className="mt-4 flex items-center gap-2">
        {product.badge ? <Badge tone={product.badge === "Bán chạy" ? "sun" : "teal"}>{product.badge}</Badge> : null}
        {!product.inStock ? <Badge>Hết hàng</Badge> : null}
      </div>
      <h3 className="mt-2 text-lg font-semibold group-hover:text-sky">{product.name}</h3>
      {product.levels.length ? <p className="text-sm text-muted">{levelLabels(product.levels)}</p> : null}
      <p className="mt-2 line-clamp-2 text-sm text-muted">{product.summary}</p>
      <p className="mt-auto pt-4 font-semibold">
        {product.kind === "combo" && product.fromPriceVnd !== null ? "Từ " : ""}
        <Price amountVnd={product.fromPriceVnd} />
      </p>
    </Link>
  );
}
