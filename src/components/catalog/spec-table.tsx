import type { ProductDetail } from "@/lib/api/types";

export function SpecTable({ specs }: { specs: ProductDetail["specs"] }) {
  return (
    <div className="space-y-8">
      {specs.map((group) => (
        <div key={group.group}>
          <h3 className="text-lg font-semibold">{group.group}</h3>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            {group.items.map((item) => (
              <div key={item.label} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6">
                <dt className="text-muted">{item.label}</dt>
                <dd className="font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
