import type { ProductDetail, ProductKind, PurchaseMode } from "@/lib/api/types";

export interface AdminVariant {
  id: string;
  sku: string;
  title: string;
  priceVnd: number;
  compareAtVnd: number | null;
  purchaseMode: PurchaseMode;
  isActive: boolean;
  inventory: { onHand: number; reserved: number } | null;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  summary: string;
  summaryEn: string | null;
  kind: ProductKind;
  status: "draft" | "published" | "archived" | string;
  coverImageUrl: string | null;
  levels: string[];
  gallery: ProductDetail["gallery"];
  specs: ProductDetail["specs"];
  inTheBox: string[];
  faq: ProductDetail["faq"];
  brochureUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  badge: string | null;
  sortOrder: number;
  featured: boolean;
  variants: AdminVariant[];
}

export interface AdminProductDetail extends AdminProduct {
  comboItems: Array<{ productSlug: string; productName: string; quantity: number; note: string | null }>;
  sizeTiers: Array<{ students: number; priceVnd: number; label: string | null }>;
}

export const KIND_LABEL: Record<string, string> = { combo: "Combo", drone: "Drone", education_kit: "Bộ giáo dục", part: "Linh kiện", accessory: "Phụ kiện", bundle: "Gói", course: "Khóa học" };
export const STATUS_LABEL: Record<string, string> = { draft: "Bản nháp", published: "Đang bán", archived: "Ngừng bán" };
export const MODE_LABEL: Record<string, string> = { checkout: "Mua online", preorder: "Đặt trước", quote_only: "Chỉ báo giá" };
