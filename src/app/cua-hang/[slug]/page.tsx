import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuyBox } from "@/components/catalog/buy-box";
import { FaqList } from "@/components/catalog/faq-list";
import { Gallery } from "@/components/catalog/gallery";
import { ProductCard } from "@/components/catalog/product-card";
import { levelLabels, productHref } from "@/components/catalog/product-tile";
import { SpecTable } from "@/components/catalog/spec-table";
import { Breadcrumbs } from "@/components/page/breadcrumbs";
import { DetailSection } from "@/components/page/detail-section";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getProduct } from "@/lib/api/server";
import type { ProductDetail } from "@/lib/api/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.summary,
    alternates: { canonical: productHref(product) },
    openGraph: product.coverImageUrl ? { images: [product.coverImageUrl] } : undefined,
  };
}

function jsonLd(product: ProductDetail) {
  const variant = product.variants[0];
  const price = variant?.priceVnd ?? product.fromPriceVnd;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    image: product.gallery.map((g) => g.url),
    sku: variant?.sku,
    brand: { "@type": "Brand", name: "Drone Việt" },
    ...(price !== null
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "VND",
            availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `https://www.droneviet.vn${productHref(product)}`,
          },
        }
      : {}),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  if (product.kind === "combo") redirect(productHref(product));

  const gallery = product.gallery.length ? product.gallery : product.coverImageUrl ? [{ url: product.coverImageUrl, alt: product.name }] : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(product)).replace(/</g, "\\u003c") }} />
      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Cửa hàng", href: "/cua-hang" }, { label: product.name }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Gallery images={gallery} name={product.name} />
          <div>
            <div className="flex flex-wrap gap-2">
              {product.badge ? <Badge tone={product.badge === "Bán chạy" ? "sun" : "teal"}>{product.badge}</Badge> : null}
              {product.levels.length ? <Badge tone="sky">{levelLabels(product.levels)}</Badge> : null}
            </div>
            <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-4 text-lg text-muted">{product.summary}</p>
            <div className="mt-8"><BuyBox product={product} /></div>
            <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm text-muted">
              <li>Giao hàng toàn quốc, kiểm tra hàng khi nhận.</li>
              <li>Hỗ trợ kỹ thuật qua Zalo trong giờ hành chính.</li>
              <li>Cần số lượng lớn cho trường? <a href={`/bao-gia?san-pham=${product.slug}`} className="font-semibold text-sky-ink underline underline-offset-4">Nhận báo giá</a></li>
            </ul>
          </div>
        </div>
      </Container>

      {product.inTheBox.length ? (
        <DetailSection id="trong-hop" title="Trong hộp có gì">
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.inTheBox.map((item) => <li key={item} className="rounded-xl bg-sky-50 px-4 py-3">{item}</li>)}
          </ul>
        </DetailSection>
      ) : null}

      {product.specs.length ? (
        <DetailSection id="thong-so" title="Thông số kỹ thuật"><SpecTable specs={product.specs} /></DetailSection>
      ) : null}

      {product.faq.length ? (
        <DetailSection id="hoi-dap" title="Câu hỏi thường gặp"><FaqList items={product.faq} /></DetailSection>
      ) : null}

      {product.compatible.length ? (
        <DetailSection id="tuong-thich" title="Dùng kèm với" wide>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {product.compatible.map((p) => <li key={p.slug} className="flex"><ProductCard product={p} /></li>)}
          </ul>
        </DetailSection>
      ) : null}
    </>
  );
}

