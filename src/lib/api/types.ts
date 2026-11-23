/** Mirrors the API responses from backend Plan 1 (spec §9). */
export type ProductKind = "combo" | "drone" | "part" | "accessory" | "education_kit" | "bundle" | "course";
export type ProductLevel = "tieu-hoc" | "thcs" | "thpt" | "dai-hoc" | "quoc-te";
export type PurchaseMode = "checkout" | "preorder" | "quote_only";

export interface ProductCard {
  slug: string;
  name: string;
  nameEn: string | null;
  summary: string;
  kind: ProductKind;
  levels: ProductLevel[];
  coverImageUrl: string | null;
  badge: string | null;
  fromPriceVnd: number | null;
  purchaseMode: PurchaseMode;
  inStock: boolean;
  featured: boolean;
}

export interface ProductDetail extends ProductCard {
  summaryEn: string | null;
  gallery: Array<{ url: string; alt: string }>;
  specs: Array<{ group: string; items: Array<{ label: string; value: string }> }>;
  inTheBox: string[];
  faq: Array<{ q: string; a: string }>;
  brochureUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: Array<{ id: string; sku: string; title: string; priceVnd: number; compareAtVnd: number | null; purchaseMode: PurchaseMode; stock: number }>;
  compatible: ProductCard[];
  comboItems: Array<{ product: ProductCard; quantity: number; note: string | null }>;
  sizeTiers: Array<{ students: number; priceVnd: number; label: string | null }>;
}

export interface ArticleSummary {
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  tags: string[];
  levels: string[];
  kind: "guide" | "research" | "news" | string;
  publishedAt: string | null;
  readingMinutes: number | null;
}

export interface Article extends ArticleSummary {
  bodyMarkdown: string;
  attachments: Array<{ url: string; label: string }>;
  relatedProducts: ProductCard[];
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface CourseCard {
  slug: string;
  title: string;
  summary: string;
  level: string;
  format: string;
  durationHours: number | null;
  tuitionVnd: number | null;
  certificateTrack: string | null;
  /** Zalo group for the course or workshop. */
  zaloGroupUrl?: string | null;
  nextSessionAt?: string | null;
}

export interface CourseDetail extends CourseCard {
  descriptionMarkdown: string | null;
  sessions: Array<{ id: string; startsAt: string; capacity: number; seatsLeft: number }>;
}

export interface ContactSettings {
  zalo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  companyName: string | null;
}

export interface PublicSettings {
  contact: ContactSettings;
  announcement: { text: string; href: string | null } | null;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
}

export interface MyOrder {
  orderNumber: string;
  status: string;
  totalVnd: number;
  createdAt: string;
  lines: Array<{ title: string; quantity: number; subtotalVnd: number }>;
}

export const DEFAULT_SETTINGS: PublicSettings = {
  contact: { zalo: "0384070636", phone: null, email: null, address: null, companyName: null },
  announcement: null,
};
