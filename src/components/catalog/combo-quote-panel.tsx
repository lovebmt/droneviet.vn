"use client";

import { useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import type { ProductDetail } from "@/lib/api/types";

/**
 * Combos are sold by quote. With size tiers the visitor picks a class size and sees the estimate,
 * which also travels to the quote form; without tiers the estimator is hidden (spec §5.3).
 */
export function ComboQuotePanel({ product }: { product: Pick<ProductDetail, "slug" | "fromPriceVnd" | "sizeTiers"> }) {
  const tiers = [...product.sizeTiers].sort((a, b) => a.students - b.students);
  const [students, setStudents] = useState<number | null>(tiers[0]?.students ?? null);
  const tier = tiers.find((t) => t.students === students) ?? null;
  const query = new URLSearchParams({ "san-pham": product.slug });
  if (tier) query.set("hoc-sinh", String(tier.students));

  return (
    <div className="space-y-5">
      {tiers.length ? (
        <>
          <div role="group" aria-label="Quy mô lớp" className="flex flex-wrap gap-2">
            {tiers.map((t) => (
              <button
                key={t.students}
                type="button"
                aria-pressed={t.students === students}
                onClick={() => setStudents(t.students)}
                className={`rounded-full border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky ${t.students === students ? "border-sky bg-sky-50 font-semibold text-sky" : "border-line hover:border-ink"}`}
              >
                {t.label ?? `${t.students} học sinh`}
              </button>
            ))}
          </div>
          <div aria-live="polite">
            <p className="text-sm text-muted">Dự toán cho lớp {tier?.students} học sinh</p>
            <p className="text-3xl font-semibold">{tier ? formatVnd(tier.priceVnd) : null}</p>
            <p className="mt-1 text-sm text-muted">Giá tham khảo, báo giá chính thức theo nhu cầu của trường.</p>
          </div>
        </>
      ) : (
        <p className="text-3xl font-semibold">{product.fromPriceVnd === null ? "Liên hệ báo giá" : `Từ ${formatVnd(product.fromPriceVnd)}`}</p>
      )}
      <LinkButton href={`/bao-gia?${query}`} size="lg">Nhận tư vấn & báo giá</LinkButton>
    </div>
  );
}
