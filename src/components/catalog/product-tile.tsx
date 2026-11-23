import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProductCard } from "@/lib/api/types";
import { ProductImage } from "./product-image";

const LEVEL_LABEL: Record<string, string> = { "tieu-hoc": "Tiểu học", thcs: "THCS", thpt: "THPT", "dai-hoc": "Đại học", "quoc-te": "Quốc tế" };

export function productHref(product: Pick<ProductCard, "slug" | "kind">): string {
  return product.kind === "combo" ? `/cua-hang/combo/${product.slug}` : `/cua-hang/${product.slug}`;
}

export function levelLabels(levels: string[]): string {
  return levels.map((level) => LEVEL_LABEL[level] ?? level).join(", ");
}

/** Large DJI-style tile: context line, light product name, one sentence, two text links (spec §7.5). */
export function ProductTile({ product, context }: { product: ProductCard; context?: string }) {
  const href = productHref(product);
  const action = product.kind === "combo" || product.purchaseMode !== "checkout"
    ? { label: "Nhận báo giá", href: `/bao-gia?san-pham=${product.slug}` }
    : { label: "Mua ngay", href };
  return (
    <article className="flex min-h-[420px] flex-col items-center rounded-2xl bg-sky-50 px-6 pt-10 text-center">
      <p className="text-sm text-muted">{context ?? (product.levels.length ? `Cho ${levelLabels(product.levels)}` : "Drone Việt")}</p>
      <h3 className="mt-2 text-balance text-3xl font-light tracking-tight sm:text-4xl"><Link href={href} className="hover:text-sky">{product.name}</Link></h3>
      <p className="mt-2 max-w-md font-semibold">{product.summary}</p>
      {product.badge ? <div className="mt-3"><Badge tone={product.badge === "Bán chạy" ? "sun" : "teal"}>{product.badge}</Badge></div> : null}
      <div className="mt-4 flex gap-5 text-[15px]">
        <Link href={href} className="inline-flex items-center gap-0.5 font-medium hover:underline underline-offset-4">
          Tìm hiểu <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <Link href={action.href} className="inline-flex items-center gap-0.5 font-medium text-sky hover:underline underline-offset-4">
          {action.label} <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
      <ProductImage src={product.coverImageUrl} alt={product.name} sizes="(min-width: 1024px) 40vw, 90vw" className="mt-8 aspect-[16/9] w-full max-w-lg" />
    </article>
  );
}
