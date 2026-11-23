import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { LEGAL_TOPICS, SAFETY_RULES } from "@/content/safety";

export const metadata: Metadata = {
  title: "Bay an toàn & cấp phép",
  description: "Nguyên tắc bay drone an toàn cho lớp học và người mới bắt đầu, cùng thông tin cấp phép bay.",
  alternates: { canonical: "/bay-an-toan" },
};

export default function SafetyPage() {
  return (
    <>
      <PageHeader
        title="Bay an toàn & cấp phép"
        lead="Những nguyên tắc cơ bản giúp học sinh và giáo viên bay drone an toàn. Quy định pháp lý chi tiết đang được cập nhật."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Hỗ trợ", href: "/ho-tro" }, { label: "Bay an toàn" }]}
      />
      <Section>
        <h2 className="text-3xl font-light tracking-tight">Nguyên tắc an toàn</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY_RULES.map((rule) => (
            <li key={rule.title} className="rounded-2xl border border-line p-6">
              <ShieldCheck size={24} strokeWidth={1.75} className="text-teal-ink" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold">{rule.title}</h3>
              <p className="mt-1 text-muted">{rule.text}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="sky">
        <h2 className="text-3xl font-light tracking-tight">Quy định và cấp phép</h2>
        <p className="mt-2 max-w-2xl text-muted">Drone Việt đang xác minh thông tin với cơ quan có thẩm quyền trước khi đăng. Liên hệ để được hướng dẫn trường hợp cụ thể.</p>
        <ul className="mt-8 divide-y divide-line rounded-2xl bg-white">
          {LEGAL_TOPICS.map((t) => (
            <li key={t.title} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <span className="font-semibold">{t.title}</span>
              <Badge>{t.text}</Badge>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="/bay-mo-phong" variant="sun">Luyện bay mô phỏng</LinkButton>
          <LinkButton href="/dao-tao/chung-chi" variant="secondary">Lộ trình chứng chỉ</LinkButton>
        </div>
      </Section>
    </>
  );
}
