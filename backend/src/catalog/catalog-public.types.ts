import type { PurchaseMode } from "./entities/product-variant.entity";
import type { ProductFaq, ProductImage, ProductKind, ProductLevel, ProductSpecGroup } from "./entities/product.entity";

/** Card shown in listings (spec §9.1). */
export interface PublicProductCard {
  slug: string;
  name: string;
  nameEn: string | null;
  summary: string;
  kind: ProductKind;
  levels: ProductLevel[];
  coverImageUrl: string | null;
  badge: string | null;
  /** Cheapest active variant, or cheapest combo tier; null = "Liên hệ báo giá". */
  fromPriceVnd: number | null;
  purchaseMode: PurchaseMode;
  inStock: boolean;
  featured: boolean;
}

export interface PublicProductDetail extends PublicProductCard {
  summaryEn: string | null;
  gallery: ProductImage[];
  specs: ProductSpecGroup[];
  inTheBox: string[];
  faq: ProductFaq[];
  brochureUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    priceVnd: number;
    compareAtVnd: number | null;
    purchaseMode: PurchaseMode;
    stock: number;
  }>;
  compatible: PublicProductCard[];
  comboItems: Array<{ product: PublicProductCard; quantity: number; note: string | null }>;
  sizeTiers: Array<{ students: number; priceVnd: number; label: string | null }>;
}

export interface CatalogFilter {
  kind?: string;
  level?: string;
  featured?: boolean;
}
