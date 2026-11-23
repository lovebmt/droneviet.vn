import type { Metadata } from "next";
import { LegalPageView } from "@/components/page/legal-page";
import { legalPage } from "@/content/legal";

const page = legalPage("/dao-tao/quy-dinh");

export const metadata: Metadata = {
  title: page.title,
  description: "Các văn bản pháp luật về drone đang áp dụng tại Việt Nam, văn bản đã hết hiệu lực và lưu ý cho trường học.",
  alternates: { canonical: page.href },
};

export default async function RegulationsPage() {
  return LegalPageView({ page });
}
