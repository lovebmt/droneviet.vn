import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ProductTile } from "@/components/catalog/product-tile";
import { FaqList } from "@/components/catalog/faq-list";
import { DeploymentSteps } from "@/components/education/deployment-steps";
import { LevelGrid } from "@/components/education/level-grid";
import { OfferGrid } from "@/components/education/offer-grid";
import { PageHeader } from "@/components/page/page-header";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { INTERNATIONAL, SCHOOL_FAQ } from "@/content/education";
import { listProducts } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Giáo dục",
  description: "Giải pháp drone trọn bộ cho trường học: thiết bị theo cấp học, giáo trình song ngữ, đào tạo giáo viên và hỗ trợ cả năm học.",
  alternates: { canonical: "/giao-duc", languages: { en: "/en/education" } },
};

export default async function EducationPage() {
  const combos = await listProducts("combo");

  return (
    <>
      <PageHeader
        title="Drone cho lớp học, từ tiểu học đến đại học"
        lead="Drone Việt mang đến trọn bộ thiết bị, giáo trình và đào tạo giáo viên để trường bắt đầu dạy drone ngay trong năm học này."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Giáo dục" }]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/bao-gia" size="lg">Nhận tư vấn cho trường</LinkButton>
          <LinkButton href="/cua-hang/so-sanh" size="lg" variant="secondary">So sánh combo</LinkButton>
        </div>
      </PageHeader>

      <Section>
        <h2 className="text-3xl font-light tracking-tight">Một giải pháp gồm những gì</h2>
        <div className="mt-10"><OfferGrid /></div>
      </Section>

      <Section tone="sky">
        <h2 className="text-3xl font-light tracking-tight">Chọn theo cấp học</h2>
        <p className="mt-2 max-w-2xl text-muted">Mỗi cấp học có mục tiêu, thiết bị và giáo trình riêng.</p>
        <div className="mt-8"><LevelGrid /></div>
      </Section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-light tracking-tight">{INTERNATIONAL.title}</h2>
            <p className="mt-3 text-lg text-muted">{INTERNATIONAL.lead}</p>
            <ul className="mt-6 space-y-3">
              {INTERNATIONAL.points.map((p) => (
                <li key={p} className="flex gap-3">
                  <Check size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-teal-ink" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={`/cua-hang/combo/${INTERNATIONAL.comboSlug}`}>Xem combo lớp quốc tế</LinkButton>
              <LinkButton href={`/bao-gia?san-pham=${INTERNATIONAL.comboSlug}`} variant="secondary">Nhận báo giá</LinkButton>
            </div>
          </div>
          {combos.find((c) => c.slug === INTERNATIONAL.comboSlug) ? (
            <ProductTile product={combos.find((c) => c.slug === INTERNATIONAL.comboSlug)!} context="Trọn bộ cho một lớp" />
          ) : null}
        </div>
      </Section>

      {combos.filter((c) => c.slug !== INTERNATIONAL.comboSlug).length ? (
        <Section tone="sky">
          <h2 className="text-3xl font-light tracking-tight">Combo lớp học</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {combos.filter((c) => c.slug !== INTERNATIONAL.comboSlug).map((c) => <ProductTile key={c.slug} product={c} />)}
          </div>
        </Section>
      ) : null}

      <Section>
        <h2 className="text-3xl font-light tracking-tight">Triển khai tại trường trong 4 bước</h2>
        <div className="mt-8"><DeploymentSteps /></div>
      </Section>

      <Section tone="sky">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-3xl font-light tracking-tight">Nhà trường thường hỏi</h2>
            <p className="mt-3 text-muted">Chưa thấy câu trả lời bạn cần?</p>
            <LinkButton href="/bao-gia" className="mt-6">Gửi câu hỏi cho Drone Việt</LinkButton>
          </div>
          <FaqList items={SCHOOL_FAQ} />
        </div>
      </Section>
    </>
  );
}
