import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageView } from "@/components/page/legal-page";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { legalPage } from "@/content/legal";
import { CERTIFICATE_STEPS } from "@/content/training";

const page = legalPage("/dao-tao/chung-chi");

export const metadata: Metadata = {
  title: "Chứng chỉ, giấy phép điều khiển drone",
  description: "Lộ trình lấy giấy phép điều khiển drone Hạng A, Hạng B theo Nghị định 288/2025/NĐ-CP: ai cần, học ở đâu, ai cấp, hiệu lực bao lâu.",
  alternates: { canonical: page.href },
};

export default async function CertificatePage() {
  return LegalPageView({
    page,
    before: (
        <Section tone="sky">
          <h2 className="text-2xl font-semibold">Lộ trình bốn bước</h2>
          <ol className="mt-8 max-w-3xl">
            {CERTIFICATE_STEPS.map((step, i) => (
              <li key={step.title} className="relative border-l-2 border-line pb-10 pl-8 last:pb-0">
                <span className="absolute -left-[17px] top-0 grid h-8 w-8 place-items-center rounded-full bg-sky text-sm font-semibold text-white">{i + 1}</span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-1 text-muted">{step.text}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Badge tone={step.href ? "teal" : "neutral"}>{step.status}</Badge>
                  {step.href ? <Link href={step.href} className="text-sm font-semibold text-sky-ink hover:underline underline-offset-4">Bắt đầu luyện bay</Link> : null}
                </div>
              </li>
            ))}
          </ol>
        </Section>
    ),
  });
}
