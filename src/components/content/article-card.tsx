import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import type { ArticleSummary } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

export const ARTICLE_KIND: Record<string, string> = { guide: "Hướng dẫn", research: "Nghiên cứu", news: "Tin tức" };

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link href={`/r-d/${article.slug}`} className="group flex flex-col">
      <ProductImage src={article.coverImageUrl} alt="" sizes="(min-width: 1024px) 30vw, 90vw" className="aspect-[16/9] w-full bg-sky-50" />
      <p className="mt-4 text-sm text-muted">
        {ARTICLE_KIND[article.kind] ?? "Bài viết"}
        {article.publishedAt ? `, ${formatDate(article.publishedAt)}` : ""}
        {article.readingMinutes ? `, ${article.readingMinutes} phút đọc` : ""}
      </p>
      <h3 className="mt-1 text-xl font-semibold group-hover:text-sky">{article.title}</h3>
      {article.summary ? <p className="mt-2 line-clamp-3 text-muted">{article.summary}</p> : null}
    </Link>
  );
}
