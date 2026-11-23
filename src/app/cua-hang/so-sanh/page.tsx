import type { Metadata } from "next";
import Link from "next/link";
import { levelLabels } from "@/components/catalog/product-tile";
import { EmptyState } from "@/components/page/empty-state";
import { PageHeader } from "@/components/page/page-header";
import { Container } from "@/components/ui/container";
import { getProduct, listProducts } from "@/lib/api/server";
import type { ProductDetail } from "@/lib/api/types";
import { formatVnd } from "@/lib/format";

export const metadata: Metadata = {
  title: "So sánh combo lớp học",
  description: "So sánh các combo drone cho lớp học theo cấp học, thành phần và quy mô.",
  alternates: { canonical: "/cua-hang/so-sanh" },
};

function priceText(combo: ProductDetail): string {
  if (combo.sizeTiers.length) {
    const min = Math.min(...combo.sizeTiers.map((t) => t.priceVnd));
    return `Từ ${formatVnd(min)}`;
  }
  return combo.fromPriceVnd === null ? "Liên hệ báo giá" : `Từ ${formatVnd(combo.fromPriceVnd)}`;
}

function sizes(combo: ProductDetail): string {
  if (!combo.sizeTiers.length) return "Theo nhu cầu";
  return combo.sizeTiers.map((t) => t.students).sort((a, b) => a - b).join(", ") + " học sinh";
}

export default async function ComparePage() {
  const cards = await listProducts("combo");
  const combos = (await Promise.all(cards.map((c) => getProduct(c.slug)))).filter((c): c is ProductDetail => c !== null);

  const rows: Array<{ label: string; cell: (c: ProductDetail) => React.ReactNode }> = [
    { label: "Cấp học", cell: (c) => (c.levels.length ? levelLabels(c.levels) : "Đang cập nhật") },
    { label: "Quy mô lớp", cell: sizes },
    {
      label: "Thành phần",
      cell: (c) =>
        c.comboItems.length ? (
          <ul className="space-y-1">
            {c.comboItems.map((item) => <li key={item.product.slug}>{item.quantity} × {item.product.name}</li>)}
          </ul>
        ) : "Đang cập nhật",
    },
    { label: "Dịch vụ đi kèm", cell: (c) => (c.inTheBox.length ? <ul className="space-y-1">{c.inTheBox.map((i) => <li key={i}>{i}</li>)}</ul> : "Đang cập nhật") },
    { label: "Giá tham khảo", cell: priceText },
  ];

  return (
    <>
      <PageHeader
        title="So sánh combo lớp học"
        lead="Đặt các combo cạnh nhau để chọn đúng gói cho cấp học và quy mô lớp của trường."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Cửa hàng", href: "/cua-hang" }, { label: "So sánh combo" }]}
      />
      <Container className="py-12">
        {combos.length ? (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="sr-only">So sánh các combo lớp học</caption>
              <thead className="bg-sky-50">
                <tr>
                  <th scope="col" className="w-40 p-4 font-semibold text-muted">Tiêu chí</th>
                  {combos.map((c) => (
                    <th key={c.slug} scope="col" className="p-4 align-top">
                      <span className="block text-base font-semibold">{c.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="p-4 align-top font-semibold text-muted">{row.label}</th>
                    {combos.map((c) => <td key={c.slug} className="p-4 align-top">{row.cell(c)}</td>)}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="p-4"><span className="sr-only">Hành động</span></th>
                  {combos.map((c) => (
                    <td key={c.slug} className="p-4">
                      <div className="flex flex-col gap-2">
                        <Link href={`/cua-hang/combo/${c.slug}`} className="font-semibold text-sky hover:underline underline-offset-4">Xem chi tiết</Link>
                        <Link href={`/bao-gia?san-pham=${c.slug}`} className="font-semibold hover:underline underline-offset-4">Nhận báo giá</Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Chưa có combo để so sánh">
            <Link href="/bao-gia" className="font-semibold text-sky underline underline-offset-4">Gửi yêu cầu tư vấn</Link> để được đề xuất gói phù hợp.
          </EmptyState>
        )}
      </Container>
    </>
  );
}
