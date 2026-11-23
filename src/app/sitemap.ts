import type { MetadataRoute } from "next";
import { productHref } from "@/components/catalog/product-tile";
import { LEVELS } from "@/content/levels";
import { listArticles, listCourses, listProducts } from "@/lib/api/server";
import type { ProductKind } from "@/lib/api/types";

const SITE = "https://www.droneviet.vn";
const STATIC = ["/", "/giao-duc", "/cua-hang", "/cua-hang/so-sanh", "/dao-tao", "/dao-tao/chung-chi", "/dao-tao/cap-phep", "/dao-tao/quy-dinh", "/dao-tao/ban-do", "/giao-duc/workshop", "/r-d", "/bay-mo-phong", "/ho-tro", "/bay-an-toan", "/bao-gia", "/en", "/en/education", "/chinh-sach-bao-mat", "/dieu-khoan-su-dung"];
const KINDS: ProductKind[] = ["combo", "drone", "education_kit", "part", "accessory"];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles, courses] = await Promise.all([
    Promise.all(KINDS.map((k) => listProducts(k))).then((l) => l.flat()),
    listArticles({ limit: 500 }),
    listCourses(),
  ]);
  const combos = products.filter((p) => p.kind === "combo");
  return [
    ...STATIC.map((path) => ({ url: `${SITE}${path}`, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...LEVELS.map((l) => ({ url: `${SITE}/giao-duc/${l.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE}${productHref(p)}`, priority: p.kind === "combo" ? 0.9 : 0.6 })),
    ...combos.map((p) => ({ url: `${SITE}/en/combo/${p.slug}`, priority: 0.5 })),
    ...articles.map((a) => ({ url: `${SITE}/r-d/${a.slug}`, lastModified: a.publishedAt ?? undefined, priority: 0.6 })),
    // Workshops are presented on /giao-duc/workshop.
    ...courses.filter((c) => c.level !== "workshop").map((c) => ({ url: `${SITE}/dao-tao/${c.slug}`, priority: 0.6 })),
  ];
}
