import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/content/article-card";
import { EmptyState } from "@/components/page/empty-state";
import { PageHeader } from "@/components/page/page-header";
import { Container } from "@/components/ui/container";
import { listArticles } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "R&D",
  description: "Hướng dẫn lắp ráp, nghiên cứu và kinh nghiệm dạy drone từ đội ngũ Drone Việt.",
  alternates: { canonical: "/r-d" },
};

const TAG_LABEL: Record<string, string> = { "lap-rap": "Lắp ráp", "lap-trinh": "Lập trình", "cam-bien": "Cảm biến", "giao-duc": "Giáo dục", "an-toan": "An toàn" };
const label = (tag: string) => TAG_LABEL[tag] ?? tag.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export default async function RdPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const [all, filtered] = await Promise.all([listArticles({ limit: 100 }), tag ? listArticles({ tag, limit: 100 }) : null]);
  const articles = [...(filtered ?? all)].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const tags = [...new Set(all.flatMap((a) => a.tags))].sort();
  const chip = (active: boolean) => `rounded-full border px-4 py-2 text-sm ${active ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white hover:border-ink"}`;

  return (
    <>
      <PageHeader
        title="R&D"
        lead="Hướng dẫn lắp ráp, lập trình, nghiên cứu và kinh nghiệm đưa drone vào lớp học."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "R&D" }]}
      >
        {tags.length ? (
          <nav aria-label="Chủ đề" className="mt-6 flex flex-wrap gap-2">
            <Link href="/r-d" className={chip(!tag)} aria-current={!tag ? "page" : undefined}>Tất cả</Link>
            {tags.map((t) => (
              <Link key={t} href={`/r-d?tag=${encodeURIComponent(t)}`} className={chip(t === tag)} aria-current={t === tag ? "page" : undefined}>{label(t)}</Link>
            ))}
          </nav>
        ) : null}
      </PageHeader>
      <Container className="py-12 sm:py-16">
        {articles.length ? (
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <li key={a.slug}><ArticleCard article={a} /></li>)}
          </ul>
        ) : (
          <EmptyState title={tag ? "Chưa có bài viết cho chủ đề này" : "Bài viết đang được chuẩn bị"}>
            {tag ? <Link href="/r-d" className="font-semibold text-sky-ink underline underline-offset-4">Xem tất cả bài viết</Link> : "Quay lại sau nhé."}
          </EmptyState>
        )}
      </Container>
    </>
  );
}
