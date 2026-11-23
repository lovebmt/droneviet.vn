import { productHref } from "@/components/catalog/product-tile";
import type { ProductDetail } from "@/lib/api/types";
import { absolute, SITE_NAME } from "./site";

export type JsonLdNode = Record<string, unknown> & { "@type": string };

/** Renders schema.org data; "<" is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const payload = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : { "@context": "https://schema.org", ...data };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }} />;
}

/** Answers still marked "Đang cập nhật" are placeholders, not answers. */
const isRealAnswer = (a: string) => a.trim() !== "" && !/^đang cập nhật/i.test(a.trim());

export function productJsonLd(product: ProductDetail): JsonLdNode[] {
  const variant = product.variants[0];
  const price = variant?.priceVnd ?? product.fromPriceVnd;
  const nodes: JsonLdNode[] = [
    {
      "@type": "Product",
      name: product.name,
      description: product.summary,
      image: product.gallery.map((g) => g.url),
      sku: variant?.sku,
      brand: { "@type": "Brand", name: SITE_NAME },
      ...(price !== null
        ? {
            offers: {
              "@type": "Offer",
              price,
              priceCurrency: "VND",
              availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: absolute(productHref(product)),
            },
          }
        : {}),
    },
  ];
  const answered = product.faq.filter((f) => isRealAnswer(f.a));
  if (answered.length) {
    nodes.push({
      "@type": "FAQPage",
      mainEntity: answered.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return nodes;
}
