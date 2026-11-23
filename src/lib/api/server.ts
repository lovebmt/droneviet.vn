import { apiBase } from "./base";
import {
  DEFAULT_SETTINGS,
  type Article,
  type ArticleSummary,
  type CourseCard,
  type CourseDetail,
  type ProductCard,
  type ProductDetail,
  type ProductKind,
  type PublicSettings,
} from "./types";

/**
 * Server-side reads for public pages, cached by tag (previous Next caching model) and refreshed
 * by POST /api/revalidate. A failing API never breaks a page: callers get their fallback.
 */
export async function apiGet<T>(path: string, opts: { tags: string[]; revalidate?: number; fallback: T }): Promise<T> {
  try {
    const response = await fetch(`${apiBase()}${path}`, { next: { tags: opts.tags, revalidate: opts.revalidate ?? 300 } });
    if (!response.ok) {
      console.error(`API ${path}: HTTP ${response.status}`);
      return opts.fallback;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`API ${path} unreachable: ${error instanceof Error ? error.message : error}`);
    return opts.fallback;
  }
}

/** Like apiGet but distinguishes "not found" (null) for detail pages. */
export async function apiGetOrNull<T>(path: string, opts: { tags: string[]; revalidate?: number }): Promise<T | null> {
  try {
    const response = await fetch(`${apiBase()}${path}`, { next: { tags: opts.tags, revalidate: opts.revalidate ?? 300 } });
    if (!response.ok) {
      if (response.status !== 404) console.error(`API ${path}: HTTP ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`API ${path} unreachable: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

export function listProducts(kind: ProductKind, opts: { level?: string; featured?: boolean } = {}): Promise<ProductCard[]> {
  const query = new URLSearchParams({ kind });
  if (opts.level) query.set("level", opts.level);
  if (opts.featured !== undefined) query.set("featured", String(opts.featured));
  return apiGet<ProductCard[]>(`/catalog/products?${query}`, { tags: ["catalog"], fallback: [] });
}

export function getProduct(slug: string): Promise<ProductDetail | null> {
  return apiGetOrNull<ProductDetail>(`/catalog/products/${encodeURIComponent(slug)}`, { tags: ["catalog", `product:${slug}`] });
}

/** Legal guides (kind "phap-ly") are only returned when asked for by `kind`. */
export function listArticles(opts: { tag?: string; level?: string; limit?: number; kind?: string } = {}): Promise<ArticleSummary[]> {
  const query = new URLSearchParams();
  if (opts.kind) query.set("kind", opts.kind);
  if (opts.tag) query.set("tag", opts.tag);
  if (opts.level) query.set("level", opts.level);
  if (opts.limit) query.set("limit", String(opts.limit));
  const suffix = query.size ? `?${query}` : "";
  return apiGet<ArticleSummary[]>(`/content/articles${suffix}`, { tags: ["articles"], fallback: [] });
}

export function getArticle(slug: string): Promise<Article | null> {
  return apiGetOrNull<Article>(`/content/articles/${encodeURIComponent(slug)}`, { tags: ["articles", `article:${slug}`] });
}

/** `level: "workshop"` lists only workshops (shown under Giáo dục, not Đào tạo). */
export function listCourses(opts: { level?: string } = {}): Promise<CourseCard[]> {
  const suffix = opts.level ? `?level=${encodeURIComponent(opts.level)}` : "";
  return apiGet<CourseCard[]>(`/courses${suffix}`, { tags: ["courses"], fallback: [], revalidate: 120 });
}

export function getCourse(slug: string): Promise<CourseDetail | null> {
  return apiGetOrNull<CourseDetail>(`/courses/${encodeURIComponent(slug)}`, { tags: ["courses", `course:${slug}`], revalidate: 60 });
}

export function getSettings(): Promise<PublicSettings> {
  return apiGet<PublicSettings>("/settings/public", { tags: ["settings"], fallback: DEFAULT_SETTINGS });
}
