import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductTile } from "@/components/catalog/product-tile";
import { LevelGrid } from "@/components/education/level-grid";
import { EmptyState } from "@/components/page/empty-state";
import { PageHeader } from "@/components/page/page-header";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { findLevel, LEVELS } from "@/content/levels";
import { listProducts } from "@/lib/api/server";
import type { ProductCard as Card, ProductKind } from "@/lib/api/types";

type Props = { params: Promise<{ cap: string }> };

export function generateStaticParams() {
  return LEVELS.map((level) => ({ cap: level.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const level = findLevel((await params).cap);
  if (!level) return { title: "Không tìm thấy" };
  return { title: `Drone cho ${level.name}`, description: level.lead, alternates: { canonical: `/giao-duc/${level.slug}` } };
}

async function byLevel(kind: ProductKind, levels: string[]): Promise<Card[]> {
  const lists = await Promise.all(levels.map((level) => listProducts(kind, { level })));
  const seen = new Set<string>();
  return lists.flat().filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));
}

export default async function LevelPage({ params }: Props) {
  const level = findLevel((await params).cap);
  if (!level) notFound();
  const [combos, drones] = await Promise.all([byLevel("combo", level.apiLevels), byLevel("drone", level.apiLevels)]);

  return (
    <>
      <PageHeader
        title={`Drone cho ${level.name}`}
        lead={level.lead}
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Giáo dục", href: "/giao-duc" }, { label: level.name }]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={combos[0] ? `/bao-gia?san-pham=${combos[0].slug}` : "/bao-gia"} size="lg">Nhận tư vấn cho {level.name}</LinkButton>
        </div>
      </PageHeader>

      <Section>
        <h2 className="text-3xl font-light tracking-tight">Học sinh sẽ làm được gì</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {level.goals.map((goal) => (
            <li key={goal} className="flex gap-3 rounded-2xl bg-sky-50 p-5">
              <Check size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-teal-ink" aria-hidden="true" />
              <span className="font-medium">{goal}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="sky">
        <h2 className="text-3xl font-light tracking-tight">Combo cho {level.name}</h2>
        {combos.length ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {combos.map((c) => <ProductTile key={c.slug} product={c} />)}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState title="Combo cho cấp học này đang được hoàn thiện">Gửi yêu cầu để Drone Việt đề xuất cấu hình phù hợp với lớp của bạn.</EmptyState>
          </div>
        )}
      </Section>

      {drones.length ? (
        <Section>
          <h2 className="text-3xl font-light tracking-tight">Drone phù hợp</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {drones.map((p) => <li key={p.slug} className="flex"><ProductCard product={p} /></li>)}
          </ul>
        </Section>
      ) : null}

      <Section tone="sky">
        <h2 className="text-2xl font-semibold tracking-tight">Cấp học khác</h2>
        <div className="mt-6"><LevelGrid exclude={level.slug} /></div>
      </Section>
    </>
  );
}
