import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, MessageCircle } from "lucide-react";
import { ComboQuotePanel } from "@/components/catalog/combo-quote-panel";
import { FaqList } from "@/components/catalog/faq-list";
import { Gallery } from "@/components/catalog/gallery";
import { ProductImage } from "@/components/catalog/product-image";
import { levelLabels, productHref } from "@/components/catalog/product-tile";
import { SpecTable } from "@/components/catalog/spec-table";
import { Breadcrumbs } from "@/components/page/breadcrumbs";
import { DetailSection } from "@/components/page/detail-section";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getProduct, getSettings } from "@/lib/api/server";
import { DEPLOYMENT_STEPS } from "@/content/levels";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || product.kind !== "combo") return { title: "Không tìm thấy combo" };
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.summary,
    alternates: { canonical: `/cua-hang/combo/${product.slug}`, languages: { en: `/en/combo/${product.slug}` } },
    openGraph: product.coverImageUrl ? { images: [product.coverImageUrl] } : undefined,
  };
}

export default async function ComboPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProduct(slug), getSettings()]);
  if (!product || product.kind !== "combo") notFound();

  const gallery = product.gallery.length ? product.gallery : product.coverImageUrl ? [{ url: product.coverImageUrl, alt: product.name }] : [];
  const zalo = settings.contact.zalo;

  return (
    <>
      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Combo lớp học", href: "/cua-hang?loai=combo" }, { label: product.name }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Gallery images={gallery} name={product.name} />
          <div>
            <div className="flex flex-wrap gap-2">
              {product.badge ? <Badge tone="sun">{product.badge}</Badge> : null}
              {product.levels.length ? <Badge tone="sky">{levelLabels(product.levels)}</Badge> : null}
            </div>
            <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-4 text-lg text-muted">{product.summary}</p>
            <div className="mt-8"><ComboQuotePanel product={product} /></div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {zalo ? (
                <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-sky hover:underline underline-offset-4">
                  <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /> Chat Zalo {zalo}
                </a>
              ) : null}
              {product.brochureUrl ? (
                <a href={product.brochureUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-sky hover:underline underline-offset-4">
                  <FileText size={18} strokeWidth={1.75} aria-hidden="true" /> Tải brochure (PDF)
                </a>
              ) : null}
              <Link href="/cua-hang/so-sanh" className="font-semibold text-ink hover:underline underline-offset-4">So sánh các combo</Link>
            </div>
          </div>
        </div>
      </Container>

      {product.comboItems.length ? (
        <DetailSection id="thanh-phan" title="Combo gồm những gì" wide>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.comboItems.map((item) => (
              <li key={item.product.slug} className="flex gap-4 rounded-2xl border border-line p-4">
                <ProductImage src={item.product.coverImageUrl} alt={item.product.name} sizes="96px" className="h-20 w-24 shrink-0 bg-sky-50" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-teal-ink">{item.quantity} ×</p>
                  <Link href={productHref(item.product)} className="font-semibold hover:text-sky">{item.product.name}</Link>
                  {item.note ? <p className="text-sm text-muted">{item.note}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {product.inTheBox.length ? (
        <DetailSection id="dich-vu-kem" title="Dịch vụ đi kèm">
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.inTheBox.map((item) => <li key={item} className="rounded-xl bg-sky-50 px-4 py-3">{item}</li>)}
          </ul>
        </DetailSection>
      ) : null}

      <DetailSection id="trien-khai" title="Triển khai tại trường" wide>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEPLOYMENT_STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl bg-sky-50 p-5">
              <p className="text-sm font-semibold text-sky">Bước {i + 1}</p>
              <p className="mt-1 font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </DetailSection>

      {product.specs.length ? (
        <DetailSection id="thong-so" title="Thông số"><SpecTable specs={product.specs} /></DetailSection>
      ) : null}

      {product.faq.length ? (
        <DetailSection id="hoi-dap" title="Câu hỏi thường gặp"><FaqList items={product.faq} /></DetailSection>
      ) : null}
    </>
  );
}
