import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComboQuotePanel } from "@/components/catalog/combo-quote-panel";
import { Gallery } from "@/components/catalog/gallery";
import { productHref } from "@/components/catalog/product-tile";
import { EnShell } from "@/components/page/en-shell";
import { Container } from "@/components/ui/container";
import { getProduct } from "@/lib/api/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product || product.kind !== "combo") return { title: "Not found" };
  return {
    title: product.nameEn ?? product.name,
    description: product.summaryEn ?? product.summary,
    alternates: { canonical: `/en/combo/${product.slug}`, languages: { vi: `/cua-hang/combo/${product.slug}` } },
  };
}

export default async function EnComboPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product || product.kind !== "combo") notFound();
  const name = product.nameEn ?? product.name;
  const summary = product.summaryEn ?? product.summary;
  const gallery = product.gallery.length ? product.gallery : product.coverImageUrl ? [{ url: product.coverImageUrl, alt: name }] : [];

  return (
    <EnShell viHref={`/cua-hang/combo/${product.slug}`}>
      <Container className="py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Gallery images={gallery} name={name} />
          <div>
            <h1 className="text-4xl font-light tracking-tight sm:text-5xl">{name}</h1>
            <p className="mt-4 text-lg text-muted" lang={product.summaryEn ? "en" : "vi"}>{summary}</p>
            <div className="mt-8"><ComboQuotePanel product={product} locale="en" /></div>
          </div>
        </div>
        {product.comboItems.length ? (
          <section className="mt-16 border-t border-line pt-10">
            <h2 className="text-2xl font-semibold">What is in the kit</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {product.comboItems.map((item) => (
                <li key={item.product.slug} className="rounded-2xl border border-line p-4">
                  <span className="text-sm font-semibold text-teal-ink">{item.quantity} ×</span>{" "}
                  <Link href={productHref(item.product)} className="font-semibold hover:text-sky-ink">{item.product.nameEn ?? item.product.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </EnShell>
  );
}
