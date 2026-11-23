import type { ArticleSummary, ProductCard, ProductDetail } from "@/lib/api/types";

export function card(overrides: Partial<ProductCard> = {}): ProductCard {
  return {
    slug: "dv-code-fleet", name: "DV Code Fleet", nameEn: null, summary: "Đội drone lập trình", kind: "drone",
    levels: ["thcs"], coverImageUrl: null, badge: null, fromPriceVnd: 24_900_000, purchaseMode: "checkout",
    inStock: true, featured: true, ...overrides,
  };
}

export const comboQuocTe = card({ slug: "combo-lop-hoc-quoc-te", name: "Combo Lớp học Quốc tế", kind: "combo", purchaseMode: "quote_only", fromPriceVnd: null, levels: ["quoc-te"] });
export const comboTieuHoc = card({ slug: "combo-tieu-hoc", name: "Combo Tiểu học", kind: "combo", purchaseMode: "quote_only", fromPriceVnd: null, levels: ["tieu-hoc"] });

export function article(overrides: Partial<ArticleSummary> = {}): ArticleSummary {
  return { slug: "lap-rap-f450", title: "Lắp ráp drone F450", summary: "Hướng dẫn", coverImageUrl: null, tags: ["lap-rap"], levels: ["thcs"], kind: "guide", publishedAt: "2026-11-20T00:00:00.000Z", readingMinutes: 6, ...overrides };
}

export function detail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    ...card(),
    summaryEn: null,
    gallery: [{ url: "/store/quadcopter-flight-02.jpg", alt: "DV Code Fleet. Ảnh: Igor Savin, CC BY-SA 3.0" }],
    specs: [{ group: "Thông tin chính", items: [{ label: "Quy mô", value: "5-10 drone" }] }],
    inTheBox: ["1 × bộ drone"],
    faq: [{ q: "Bảo hành bao lâu?", a: "Đang cập nhật" }],
    brochureUrl: null,
    seoTitle: null,
    seoDescription: null,
    variants: [{ id: "v-fleet", sku: "DV-CF", title: "Tiêu chuẩn", priceVnd: 24_900_000, compareAtVnd: 27_500_000, purchaseMode: "checkout", stock: 4 }],
    compatible: [],
    comboItems: [],
    sizeTiers: [],
    ...overrides,
  };
}
