import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { CERTIFICATE_STEPS } from "@/content/training";

export const metadata: Metadata = {
  title: "Hướng dẫn lấy chứng chỉ drone",
  description: "Lộ trình từ học lý thuyết an toàn, luyện bay mô phỏng đến thi thực hành để lấy chứng chỉ điều khiển drone.",
  alternates: { canonical: "/dao-tao/chung-chi" },
};

export default function CertificatePage() {
  return (
    <>
      <PageHeader
        title="Hướng dẫn lấy chứng chỉ"
        lead="Lộ trình bốn bước để điều khiển drone đúng quy định. Thông tin pháp lý đang được Drone Việt xác minh và sẽ cập nhật tại đây."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Đào tạo", href: "/dao-tao" }, { label: "Chứng chỉ" }]}
      />
      <Section>
        <ol className="max-w-3xl space-y-0">
          {CERTIFICATE_STEPS.map((step, i) => (
            <li key={step.title} className="relative border-l-2 border-line pb-10 pl-8 last:pb-0">
              <span className="absolute -left-[17px] top-0 grid h-8 w-8 place-items-center rounded-full bg-sky text-sm font-semibold text-white">{i + 1}</span>
              <h2 className="text-xl font-semibold">{step.title}</h2>
              <p className="mt-1 text-muted">{step.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge tone={step.status === "Đang cập nhật" ? "neutral" : "teal"}>{step.status}</Badge>
                {step.href ? <Link href={step.href} className="text-sm font-semibold text-sky hover:underline underline-offset-4">Bắt đầu luyện bay</Link> : null}
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section tone="sky">
        <h2 className="text-2xl font-semibold">Muốn được tư vấn lộ trình riêng?</h2>
        <p className="mt-2 text-muted">Drone Việt tư vấn khóa học phù hợp cho học sinh, giáo viên và người đi làm.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/dao-tao">Xem khóa học</LinkButton>
          <LinkButton href="/bao-gia" variant="secondary">Nhận tư vấn</LinkButton>
        </div>
      </Section>
    </>
  );
}
