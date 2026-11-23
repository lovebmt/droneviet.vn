import type { PublicSettings } from "@/lib/api/types";
import { JsonLd } from "@/lib/seo/json-ld";
import { absolute, SITE_NAME, SITE_SUMMARY, SITE_URL, zaloLink } from "@/lib/seo/site";

/** Organization and WebSite (with site search) for every page; contact details come from admin settings. */
export function SiteJsonLd({ settings }: { settings: PublicSettings }) {
  const { contact } = settings;
  const zalo = zaloLink(contact.zalo);
  return (
    <JsonLd
      data={[
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: contact.companyName ?? SITE_NAME,
          alternateName: SITE_NAME,
          url: SITE_URL,
          logo: absolute("/icon.png"),
          description: SITE_SUMMARY,
          ...(contact.email ? { email: contact.email } : {}),
          ...(contact.phone ? { telephone: contact.phone } : {}),
          ...(contact.address ? { address: { "@type": "PostalAddress", streetAddress: contact.address, addressCountry: "VN" } } : {}),
          ...(zalo ? { sameAs: [zalo] } : {}),
          areaServed: "VN",
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: "vi",
          publisher: { "@id": `${SITE_URL}/#organization` },
          potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/tim-kiem?q={search_term_string}`, "query-input": "required name=search_term_string" },
        },
      ]}
    />
  );
}
