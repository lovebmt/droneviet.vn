"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import type { ProductDetail } from "@/lib/api/types";

/**
 * Combos are sold by quote. With size tiers the visitor picks a class size and sees the estimate,
 * which also travels to the quote form; without tiers the estimator is hidden (spec §5.3).
 */
const LABELS = {
  vi: { group: "Quy mô lớp", students: (n: number) => `${n} học sinh`, estimate: (n?: number) => `Dự toán cho lớp ${n} học sinh`, note: "Giá tham khảo, báo giá chính thức theo nhu cầu của trường.", contact: "Liên hệ báo giá", from: "Từ", cta: "Nhận tư vấn & báo giá" },
  en: { group: "Class size", students: (n: number) => `${n} students`, estimate: (n?: number) => `Estimate for a class of ${n}`, note: "Indicative price; the final quote depends on your school's needs.", contact: "Contact us for a quote", from: "From", cta: "Request a quote" },
};

export function ComboQuotePanel({ product, locale = "vi" }: { product: Pick<ProductDetail, "slug" | "fromPriceVnd" | "sizeTiers">; locale?: "vi" | "en" }) {
  const t = LABELS[locale];
  const tiers = [...product.sizeTiers].sort((a, b) => a.students - b.students);
  const [students, setStudents] = useState<number | null>(tiers[0]?.students ?? null);
  const tier = tiers.find((x) => x.students === students) ?? null;
  const query = new URLSearchParams({ "san-pham": product.slug });
  if (tier) query.set("hoc-sinh", String(tier.students));

  return (
    <div className="space-y-5">
      {tiers.length ? (
        <>
          <div role="group" aria-label={t.group} className="flex flex-wrap gap-2">
            {tiers.map((option) => (
              <button
                key={option.students}
                type="button"
                aria-pressed={option.students === students}
                onClick={() => setStudents(option.students)}
                className={`rounded-full border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky ${option.students === students ? "border-sky bg-sky-50 font-semibold text-sky" : "border-line hover:border-ink"}`}
              >
                {option.label ?? t.students(option.students)}
              </button>
            ))}
          </div>
          <div aria-live="polite">
            <p className="text-sm text-muted">{t.estimate(tier?.students)}</p>
            <p className="text-3xl font-semibold">{tier ? formatVnd(tier.priceVnd) : null}</p>
            <p className="mt-1 text-sm text-muted">{t.note}</p>
          </div>
        </>
      ) : (
        <p className="text-3xl font-semibold">{product.fromPriceVnd === null ? t.contact : `${t.from} ${formatVnd(product.fromPriceVnd)}`}</p>
      )}
      <LinkButton href={`/bao-gia?${query}`} size="lg">{t.cta}</LinkButton>
    </div>
  );
}
