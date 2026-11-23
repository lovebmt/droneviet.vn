import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { OFFICIAL_MAP } from "@/components/flight-map/map-panel";
import { LegalPageView } from "@/components/page/legal-page";
import { Section } from "@/components/ui/section";
import { legalPage } from "@/content/legal";

const page = legalPage("/dao-tao/ban-do");

export const metadata: Metadata = {
  title: "Bản đồ khu vực cấm bay, hạn chế bay drone",
  description: "Bản đồ khu vực cấm bay, hạn chế bay drone của Bộ Quốc phòng, nhúng trực tiếp để tra cứu trước khi bay.",
  alternates: { canonical: page.href },
};

export default async function FlightMapPage() {
  return LegalPageView({
    page,
    showContent: false,
    before: (
      <Section>
        <a href={OFFICIAL_MAP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-lg font-semibold text-sky-ink hover:underline underline-offset-4">
          https://cambay.mod.gov.vn <ExternalLink size={18} strokeWidth={1.75} aria-hidden="true" />
        </a>
      </Section>
    ),
  });
}
