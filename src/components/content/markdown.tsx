import Link from "next/link";
import type { Root } from "mdast";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { formatVnd } from "@/lib/format";
import type { ProductCard } from "@/lib/api/types";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

type DirectiveNode = {
  type: "leafDirective" | "containerDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string | null | undefined>;
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

/** Maps the R&D directives (spec §9.4) to safe custom elements; unknown directives render nothing. */
function remarkDroneVietDirectives() {
  return (tree: Root) => {
    visit(tree, (node) => {
      const d = node as unknown as DirectiveNode;
      if (d.type !== "leafDirective" && d.type !== "containerDirective" && d.type !== "textDirective") return;
      const attrs = d.attributes ?? {};
      d.data ??= {};
      if (d.name === "youtube" && typeof attrs.id === "string" && YOUTUBE_ID.test(attrs.id)) {
        d.data.hName = "dv-youtube";
        d.data.hProperties = { videoId: attrs.id };
      } else if (d.name === "product" && typeof attrs.slug === "string" && /^[a-z0-9-]+$/.test(attrs.slug)) {
        d.data.hName = "dv-product";
        d.data.hProperties = { slug: attrs.slug };
      } else if (d.type === "containerDirective" && (d.name === "note" || d.name === "warning")) {
        d.data.hName = "dv-callout";
        d.data.hProperties = { tone: d.name };
      } else if (d.name === "file" && typeof attrs.url === "string" && /^https?:\/\//.test(attrs.url)) {
        d.data.hName = "dv-file";
        d.data.hProperties = { url: attrs.url, label: attrs.label ?? "Tải tệp" };
      } else {
        d.data.hName = "dv-dropped";
      }
    });
  };
}

export function Markdown({ source, relatedProducts = [] }: { source: string; relatedProducts?: ProductCard[] }) {
  const bySlug = new Map(relatedProducts.map((p) => [p.slug, p]));
  const components = {
    "dv-youtube": ({ videoId }: { videoId: string }) => (
      <span className="my-6 block aspect-video overflow-hidden rounded-xl bg-ink">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title="Video YouTube"
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </span>
    ),
    "dv-product": ({ slug }: { slug: string }) => {
      const product = bySlug.get(slug);
      return (
        <Link href={product?.kind === "combo" ? `/cua-hang/combo/${slug}` : `/cua-hang/${slug}`} className="my-6 flex items-center justify-between gap-4 rounded-xl border border-line p-4 no-underline hover:border-sky">
          <span>
            <span className="block font-semibold text-ink">{product?.name ?? slug}</span>
            {product ? <span className="block text-sm text-muted">{product.summary}</span> : null}
          </span>
          {product ? <span className="shrink-0 font-semibold text-ink">{product.fromPriceVnd === null ? "Liên hệ báo giá" : formatVnd(product.fromPriceVnd)}</span> : null}
        </Link>
      );
    },
    "dv-callout": ({ tone, children }: { tone: string; children?: ReactNode }) => (
      <aside role="note" className={`my-6 rounded-xl border-l-4 px-5 py-4 ${tone === "warning" ? "border-sun bg-[#fff8e5]" : "border-sky bg-sky-50"}`}>
        {children}
      </aside>
    ),
    "dv-file": ({ url, label }: { url: string; label: string }) => (
      <a href={url} className="my-4 inline-flex rounded-full border border-line px-4 py-2 font-semibold no-underline hover:border-sky" download>
        {label}
      </a>
    ),
    "dv-dropped": () => null,
  };

  return (
    <div className="prose-dv">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, remarkDroneVietDirectives]} skipHtml components={components as never}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
