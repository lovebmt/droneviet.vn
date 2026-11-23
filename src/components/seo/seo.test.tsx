import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "@/components/page/breadcrumbs";
import { DEFAULT_SETTINGS } from "@/lib/api/types";
import { openGraphFor } from "@/lib/seo/metadata";
import { productJsonLd } from "@/lib/seo/json-ld";
import { detail } from "@/test/fixtures";
import { SiteJsonLd } from "./site-json-ld";

const ld = (container: HTMLElement) => [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "null"));

describe("structured data and sharing", () => {
  it("site JSON-LD describes the organisation and the website search", () => {
    const { container } = render(<SiteJsonLd settings={{ ...DEFAULT_SETTINGS, contact: { ...DEFAULT_SETTINGS.contact, email: "lienhe@droneviet.vn" } }} />);
    const [graph] = ld(container);
    const org = graph["@graph"].find((n: { "@type": string }) => n["@type"] === "Organization");
    const site = graph["@graph"].find((n: { "@type": string }) => n["@type"] === "WebSite");
    expect(org).toMatchObject({ name: "Drone Việt", url: "https://www.droneviet.vn", logo: "https://www.droneviet.vn/icon.png", email: "lienhe@droneviet.vn" });
    expect(org.sameAs).toContain(`https://zalo.me/${DEFAULT_SETTINGS.contact.zalo}`);
    expect(site.potentialAction).toMatchObject({ "@type": "SearchAction", target: "https://www.droneviet.vn/tim-kiem?q={search_term_string}" });
  });

  it("breadcrumbs carry BreadcrumbList data for the linked steps and the current page", () => {
    const { container } = render(<Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Giáo dục" }, { label: "Workshop" }]} />);
    const [list] = ld(container);
    expect(list["@type"]).toBe("BreadcrumbList");
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: "https://www.droneviet.vn/" },
      { "@type": "ListItem", position: 2, name: "Workshop" },
    ]);
  });

  it("product data adds an FAQ only for questions that have real answers", () => {
    const product = detail({ faq: [{ q: "Bảo hành bao lâu?", a: "12 tháng" }, { q: "Có giao hàng không?", a: "Đang cập nhật" }] });
    const graph = productJsonLd(product);
    const faq = graph.find((n) => n["@type"] === "FAQPage");
    expect(faq?.mainEntity).toEqual([{ "@type": "Question", name: "Bảo hành bao lâu?", acceptedAnswer: { "@type": "Answer", text: "12 tháng" } }]);
    expect(productJsonLd(detail({ faq: [{ q: "A?", a: "Đang cập nhật" }] })).some((n) => n["@type"] === "FAQPage")).toBe(false);
  });

  it("page Open Graph keeps the site name and an absolute URL", () => {
    expect(openGraphFor({ title: "DV Code Fleet", description: "Drone lập trình", path: "/cua-hang/dv-code-fleet", images: ["https://api.droneviet.vn/media/a.webp"] })).toEqual({
      title: "DV Code Fleet",
      description: "Drone lập trình",
      url: "https://www.droneviet.vn/cua-hang/dv-code-fleet",
      siteName: "Drone Việt",
      locale: "vi_VN",
      type: "website",
      images: ["https://api.droneviet.vn/media/a.webp"],
    });
  });
});
