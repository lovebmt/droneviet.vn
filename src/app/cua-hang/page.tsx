import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/page/empty-state";
import { PageHeader } from "@/components/page/page-header";
import { Container } from "@/components/ui/container";
import { listProducts } from "@/lib/api/server";
import type { ProductCard as Card, ProductKind } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Cửa hàng",
  description: "Combo lớp học, drone và linh kiện cho giáo dục STEM. Mua lẻ online hoặc nhận báo giá trọn bộ cho trường.",
  alternates: { canonical: "/cua-hang" },
};

const GROUPS = [
  { loai: "combo", title: "Combo lớp học", lead: "Trọn bộ cho một lớp, báo giá theo số học sinh.", kinds: ["combo"] },
  { loai: "drone", title: "Drone", lead: "Drone lẻ cho lớp học, câu lạc bộ và thi đấu.", kinds: ["drone", "education_kit"] },
  { loai: "linh-kien", title: "Linh kiện & phụ kiện", lead: "Pin, cánh quạt, động cơ và phụ kiện thay thế.", kinds: ["part", "accessory"] },
] as const satisfies ReadonlyArray<{ loai: string; title: string; lead: string; kinds: readonly ProductKind[] }>;

async function load(kinds: readonly ProductKind[]): Promise<Card[]> {
  const lists = await Promise.all(kinds.map((kind) => listProducts(kind)));
  return lists.flat();
}

export default async function StorePage({ searchParams }: { searchParams: Promise<{ loai?: string }> }) {
  const { loai } = await searchParams;
  const selected = GROUPS.find((g) => g.loai === loai);
  const groups = selected ? [selected] : GROUPS;
  const loaded = await Promise.all(groups.map(async (g) => ({ ...g, products: await load(g.kinds) })));

  return (
    <>
      <PageHeader
        title={selected?.title ?? "Cửa hàng"}
        lead={selected?.lead ?? "Combo trọn bộ cho lớp học được báo giá theo nhu cầu. Drone lẻ và linh kiện mua online, giao toàn quốc."}
        crumbs={[{ label: "Trang chủ", href: "/" }, ...(selected ? [{ label: "Cửa hàng", href: "/cua-hang" }, { label: selected.title }] : [{ label: "Cửa hàng" }])]}
      >
        <nav aria-label="Loại sản phẩm" className="mt-6 flex flex-wrap gap-2">
          <FilterLink href="/cua-hang" active={!selected}>Tất cả</FilterLink>
          {GROUPS.map((g) => (
            <FilterLink key={g.loai} href={`/cua-hang?loai=${g.loai}`} active={selected?.loai === g.loai}>{g.title}</FilterLink>
          ))}
          <FilterLink href="/cua-hang/so-sanh" active={false}>So sánh combo</FilterLink>
        </nav>
      </PageHeader>

      <Container className="space-y-16 py-12 sm:py-16">
        {loaded.map((group) => (
          <section key={group.loai} aria-labelledby={`nhom-${group.loai}`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id={`nhom-${group.loai}`} className="text-2xl font-semibold tracking-tight sm:text-3xl">{group.title}</h2>
                {!selected ? <p className="mt-1 text-muted">{group.lead}</p> : null}
              </div>
              {!selected && group.products.length > 4 ? (
                <Link href={`/cua-hang?loai=${group.loai}`} className="text-sm font-semibold text-sky-ink hover:underline underline-offset-4">Xem tất cả</Link>
              ) : null}
            </div>
            {group.products.length ? (
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {(selected ? group.products : group.products.slice(0, 8)).map((product) => (
                  <li key={product.slug} className="flex"><ProductCard product={product} /></li>
                ))}
              </ul>
            ) : (
              <div className="mt-6">
                <EmptyState title="Chưa có sản phẩm trong nhóm này">
                  Cần tư vấn ngay? <Link href="/bao-gia" className="font-semibold text-sky-ink underline underline-offset-4">Gửi yêu cầu báo giá</Link>.
                </EmptyState>
              </div>
            )}
          </section>
        ))}
      </Container>
    </>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-sm ${active ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white hover:border-ink"}`}
    >
      {children}
    </Link>
  );
}
