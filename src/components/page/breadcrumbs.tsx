import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="inline-flex items-center gap-1">
            {i > 0 ? <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" /> : null}
            {item.href ? <Link href={item.href} className="hover:text-ink">{item.label}</Link> : <span aria-current="page" className="text-ink">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
