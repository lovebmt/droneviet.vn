import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductImage } from "@/components/catalog/product-image";
import { ARTICLE_KIND } from "@/components/content/article-card";
import { Markdown } from "@/components/content/markdown";
import { Breadcrumbs } from "@/components/page/breadcrumbs";
import { Container } from "@/components/ui/container";
import { getArticle } from "@/lib/api/server";
import { formatDate } from "@/lib/format";
import { markdownHeadings } from "@/lib/slug";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { title: "Không tìm thấy bài viết" };
  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.summary ?? undefined,
    alternates: { canonical: `/r-d/${article.slug}` },
    openGraph: { type: "article", publishedTime: article.publishedAt ?? undefined, images: article.coverImageUrl ? [article.coverImageUrl] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  const toc = markdownHeadings(article.bodyMarkdown);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary ?? undefined,
    image: article.coverImageUrl ?? undefined,
    datePublished: article.publishedAt ?? undefined,
    author: { "@type": "Organization", name: "Drone Việt" },
    mainEntityOfPage: `https://www.droneviet.vn/r-d/${article.slug}`,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "R&D", href: "/r-d" }, { label: article.title }]} />
        <header className="mx-auto mt-8 max-w-3xl">
          <p className="text-sm text-muted">
            {ARTICLE_KIND[article.kind] ?? "Bài viết"}
            {article.publishedAt ? `, ${formatDate(article.publishedAt)}` : ""}
            {article.readingMinutes ? `, ${article.readingMinutes} phút đọc` : ""}
          </p>
          <h1 className="mt-2 text-balance text-4xl font-light tracking-tight sm:text-5xl">{article.title}</h1>
          {article.summary ? <p className="mt-4 text-lg text-muted">{article.summary}</p> : null}
        </header>
        {article.coverImageUrl ? (
          <ProductImage src={article.coverImageUrl} alt="" sizes="(min-width: 1280px) 1200px, 100vw" priority className="mx-auto mt-10 aspect-[2/1] w-full max-w-5xl" />
        ) : null}

        <div className="mx-auto mt-12 grid max-w-5xl gap-12 lg:grid-cols-[1fr_14rem]">
          <div className="min-w-0">
            <Markdown source={article.bodyMarkdown} relatedProducts={article.relatedProducts} />
            {article.attachments.length ? (
              <section aria-labelledby="tai-lieu" className="mt-12 rounded-2xl bg-sky-50 p-6">
                <h2 id="tai-lieu" className="text-lg font-semibold">Tài liệu đính kèm</h2>
                <ul className="mt-3 space-y-2">
                  {article.attachments.map((a) => (
                    <li key={a.url}>
                      <a href={a.url} className="inline-flex items-center gap-2 font-semibold text-sky-ink hover:underline underline-offset-4">
                        <FileDown size={18} strokeWidth={1.75} aria-hidden="true" /> {a.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
          {toc.length > 1 ? (
            <nav aria-label="Mục lục" className="order-first text-sm lg:order-none">
              <div className="lg:sticky lg:top-24">
                <p className="font-semibold">Trong bài này</p>
                <ol className="mt-3 space-y-2 border-l border-line">
                  {toc.map((h) => (
                    <li key={h.id} className={h.depth === 3 ? "pl-7" : "pl-4"}>
                      <a href={`#${h.id}`} className="text-muted hover:text-ink">{h.text}</a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          ) : null}
        </div>
      </Container>

      {article.relatedProducts.length ? (
        <section aria-labelledby="san-pham-lien-quan" className="border-t border-line">
          <Container className="py-12">
            <h2 id="san-pham-lien-quan" className="text-2xl font-semibold">Sản phẩm trong bài</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {article.relatedProducts.map((p) => <li key={p.slug} className="flex"><ProductCard product={p} /></li>)}
            </ul>
          </Container>
        </section>
      ) : null}
    </article>
  );
}
