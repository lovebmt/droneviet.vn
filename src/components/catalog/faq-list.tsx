import { ChevronDown } from "lucide-react";

export function FaqList({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
