import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/lib/seo/json-ld";
import { absolute } from "@/lib/seo/site";

export interface Crumb {
  label: string;
  href?: string;
}

/** Linked steps plus the current page (Google wants a URL for every step but the last). */
function breadcrumbList(items: Crumb[]) {
  const steps = items.filter((item, i) => item.href || i === items.length - 1);
  return {
    "@type": "BreadcrumbList",
    itemListElement: steps.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.label, ...(item.href ? { item: absolute(item.href) } : {}) })),
  };
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn" className="text-sm text-muted">
      <JsonLd data={breadcrumbList(items)} />
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="inline-flex items-center gap-1">
            {i > 0 ? <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" /> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-ink">{item.label}</Link>
            ) : i === items.length - 1 ? (
              <span aria-current="page" className="text-ink">{item.label}</span>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
