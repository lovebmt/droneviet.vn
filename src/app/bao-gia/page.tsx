import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { ProductImage } from "@/components/catalog/product-image";
import { QuoteForm } from "@/components/forms/quote-form";
import { PageHeader } from "@/components/page/page-header";
import { Container } from "@/components/ui/container";
import { getProduct, getSettings } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Nhận tư vấn & báo giá",
  description: "Gửi nhu cầu của trường để nhận tư vấn và báo giá combo drone cho lớp học.",
  alternates: { canonical: "/bao-gia" },
};

type Search = { "san-pham"?: string; "hoc-sinh"?: string };

export default async function QuotePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const slug = params["san-pham"]?.trim() || null;
  const students = Number.parseInt(params["hoc-sinh"] ?? "", 10);
  const [product, settings] = await Promise.all([slug ? getProduct(slug) : null, getSettings()]);
  const zalo = settings.contact.zalo;

  return (
    <>
      <PageHeader
        title="Nhận tư vấn & báo giá"
        lead="Cho Drone Việt biết về lớp học của bạn. Chúng tôi đề xuất combo, lịch triển khai và gửi báo giá chi tiết."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Báo giá" }]}
      />
      <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_22rem]">
        <QuoteForm productSlug={product?.slug ?? null} students={Number.isFinite(students) && students > 0 ? students : null} />
        <aside className="space-y-6">
          {product ? (
            <div className="rounded-2xl border border-line p-5">
              <p className="text-sm text-muted">Bạn đang hỏi về</p>
              <ProductImage src={product.coverImageUrl} alt={product.name} sizes="320px" className="mt-3 aspect-[4/3] w-full bg-sky-50" />
              <p className="mt-3 font-semibold">{product.name}</p>
            </div>
          ) : null}
          <div className="rounded-2xl bg-sky-50 p-5">
            <p className="font-semibold">Cần trao đổi ngay?</p>
            <p className="mt-1 text-sm text-muted">Nhắn Zalo để được tư vấn trong giờ hành chính.</p>
            {zalo ? (
              <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-semibold text-sky-ink hover:underline underline-offset-4">
                <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /> Zalo {zalo}
              </a>
            ) : null}
          </div>
        </aside>
      </Container>
    </>
  );
}
