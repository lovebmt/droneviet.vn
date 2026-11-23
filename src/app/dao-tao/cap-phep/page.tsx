import type { Metadata } from "next";
import { LegalPageView } from "@/components/page/legal-page";
import { legalPage } from "@/content/legal";

const page = legalPage("/dao-tao/cap-phep");

export const metadata: Metadata = {
  title: page.title,
  description: "Thủ tục xin phép bay drone theo Nghị định 288/2025/NĐ-CP: trường hợp được miễn, hồ sơ, thời hạn nộp và hiệu lực phép bay.",
  alternates: { canonical: page.href },
};

export default async function PermitPage() {
  return LegalPageView({ page });
}
