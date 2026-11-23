import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Info, MessageCircle } from "lucide-react";
import { Markdown } from "@/components/content/markdown";
import { PageHeader } from "@/components/page/page-header";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { LEGAL_PAGES, type LegalPage } from "@/content/legal";
import { getArticle, getSettings } from "@/lib/api/server";

/**
 * Shared frame: header, key points, the "phap-ly" article (or a note while it is not published),
 * links to the other legal pages and a contact box. Call it as a function from the page so the
 * data is fetched before render: `return LegalPageView({ page })`.
 */
export async function LegalPageView({ page, before, after, showContent = true }: { page: LegalPage; before?: ReactNode; after?: ReactNode; showContent?: boolean }) {
  const [settings, article] = await Promise.all([getSettings(), showContent ? getArticle(page.articleSlug) : null]);
  const zalo = settings.contact.zalo ? `https://zalo.me/${settings.contact.zalo}` : null;
  const others = LEGAL_PAGES.filter((p) => p.href !== page.href);
  return (
    <>
      <PageHeader title={page.title} lead={page.lead} crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Đào tạo" }, { label: page.title }]} />
      {before}
      {showContent ? (
        <Section>
          {page.keyPoints.length ? (
            <>
              <h2 className="text-2xl font-semibold">Tóm tắt nhanh</h2>
              <ul className="mt-5 max-w-3xl space-y-3">
                {page.keyPoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <Info size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-sky-ink" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className={page.keyPoints.length ? "mt-12" : undefined}>
            {article ? (
              <div className="max-w-3xl"><Markdown source={article.bodyMarkdown} /></div>
            ) : (
              <p className="max-w-3xl rounded-2xl bg-sky-50 p-6 text-muted">Nội dung chi tiết đang cập nhật. Drone Việt đang đối chiếu văn bản pháp luật trước khi đăng.</p>
            )}
          </div>
        </Section>
      ) : null}
      {after}
      <Section tone="sky">
        <h2 className="text-2xl font-semibold">Xem thêm</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {others.map((p) => (
            <li key={p.href} className="flex">
              <Link href={p.href} className="group flex-1 rounded-2xl bg-white p-6">
                <p className="text-lg font-semibold">{p.title}</p>
                <p className="mt-1 text-sm text-muted">{p.lead}</p>
                <span className="mt-3 inline-flex items-center gap-0.5 text-sm font-semibold text-sky-ink group-hover:underline underline-offset-4">Xem <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-2xl bg-white p-6">
          <p className="font-semibold">Cần hướng dẫn cho trường hợp cụ thể?</p>
          <p className="mt-1 text-muted">Thông tin trên trang để tham khảo, không thay thế văn bản pháp luật. Drone Việt hỗ trợ trường học chuẩn bị thủ tục bay.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {zalo ? (
              <LinkButton href={zalo} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /> Nhắn Zalo Drone Việt
              </LinkButton>
            ) : null}
            <LinkButton href="/bao-gia" variant="secondary">Gửi câu hỏi</LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
