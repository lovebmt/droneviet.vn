import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { MapLauncher } from "@/components/flight-map/map-launcher";
import { OFFICIAL_MAP } from "@/components/flight-map/map-panel";
import { LegalPageView } from "@/components/page/legal-page";
import { Section } from "@/components/ui/section";
import { legalPage } from "@/content/legal";

const page = legalPage("/dao-tao/ban-do");

export const metadata: Metadata = {
  title: "Bản đồ khu vực cấm bay, hạn chế bay drone",
  description: "Bản đồ tham khảo khu vực cấm bay, hạn chế bay drone quanh sân bay và dọc biên giới Việt Nam, vẽ theo Quyết định 18/2020/QĐ-TTg.",
  alternates: { canonical: page.href },
};

const LEGEND = [
  { label: "Khu vực cấm bay", swatch: "bg-[#F04438]/60 border-[#B42318]", note: "Quanh sân bay (QĐ 18/2020/QĐ-TTg, Điều 3 khoản 4)" },
  { label: "Khu vực hạn chế bay", swatch: "bg-[#FDB022]/50 border-[#B54708]", note: "Tiếp giáp sân bay, dải biên giới (Điều 4 khoản 3, 4)" },
];

export default async function FlightMapPage() {
  return LegalPageView({
    page,
    before: (
      <Section>
        <div className="mb-6 rounded-2xl border border-line bg-sky-50 p-5">
          <p className="font-semibold">Bản đồ chỉ để tham khảo</p>
          <p className="mt-1 text-muted">
            Drone Việt vẽ lại các vùng quanh sân bay và dọc biên giới theo quy tắc của Quyết định 18/2020/QĐ-TTg. Khu quân sự, trụ sở cơ quan, khu đông người và
            độ cao trên 120 m không được vẽ. Trước khi bay, luôn kiểm tra trên bản đồ chính thức.
          </p>
          <a href={OFFICIAL_MAP} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-semibold text-sky-ink hover:underline underline-offset-4">
            Mở bản đồ chính thức của Bộ Quốc phòng <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>
        <ul className="mb-6 flex flex-wrap gap-x-8 gap-y-3" aria-label="Chú giải">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-3">
              <span className={`h-5 w-8 rounded border ${l.swatch}`} aria-hidden="true" />
              <span>
                <span className="block font-semibold">{l.label}</span>
                <span className="block text-sm text-muted">{l.note}</span>
              </span>
            </li>
          ))}
        </ul>
        <MapLauncher />
      </Section>
    ),
  });
}
