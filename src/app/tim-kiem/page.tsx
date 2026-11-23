import type { Metadata } from "next";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { ArticleCard } from "@/components/content/article-card";
import { EmptyState } from "@/components/page/empty-state";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { listArticles, listProducts } from "@/lib/api/server";
import type { ProductKind } from "@/lib/api/types";
import { fold } from "@/lib/slug";

export const metadata: Metadata = { title: "Tìm kiếm", robots: { index: false } };

const KINDS: ProductKind[] = ["combo", "drone", "education_kit", "part", "accessory"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 100).trim();
  const terms = fold(q).split(" ").filter(Boolean);
  const matches = (...fields: Array<string | null | undefined>) => {
    const hay = fold(fields.filter(Boolean).join(" "));
    return terms.every((t) => hay.includes(t));
  };

  const [productLists, articles] = terms.length ? await Promise.all([Promise.all(KINDS.map((k) => listProducts(k))), listArticles({ limit: 100 })]) : [[], []];
  const products = productLists.flat().filter((p) => matches(p.name, p.nameEn, p.summary));
  const posts = articles.filter((a) => matches(a.title, a.summary, a.tags.join(" ")));

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-4xl font-light tracking-tight">Tìm kiếm</h1>
      <form action="/tim-kiem" role="search" className="mt-6 flex max-w-2xl gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Từ khóa</span>
          <Search size={20} strokeWidth={1.75} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input name="q" type="search" defaultValue={q} autoFocus placeholder="Drone, linh kiện, bài viết…" className="min-h-12 w-full rounded-full border border-line pl-12 pr-4 text-base focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30" />
        </label>
        <Button type="submit" size="lg">Tìm</Button>
      </form>

      {terms.length ? (
        products.length || posts.length ? (
          <div className="mt-10 space-y-14">
            <p className="text-muted" aria-live="polite">{products.length + posts.length} kết quả cho “{q}”</p>
            {products.length ? (
              <section aria-labelledby="kq-san-pham">
                <h2 id="kq-san-pham" className="text-2xl font-semibold">Sản phẩm</h2>
                <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((p) => <li key={p.slug} className="flex"><ProductCard product={p} /></li>)}
                </ul>
              </section>
            ) : null}
            {posts.length ? (
              <section aria-labelledby="kq-bai-viet">
                <h2 id="kq-bai-viet" className="text-2xl font-semibold">Bài viết</h2>
                <ul className="mt-6 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((a) => <li key={a.slug}><ArticleCard article={a} /></li>)}
                </ul>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="mt-10"><EmptyState title={`Không tìm thấy kết quả cho “${q}”`}>Thử từ khóa ngắn hơn, ví dụ “pin” hoặc “combo”.</EmptyState></div>
        )
      ) : null}
    </Container>
  );
}
