import { Injectable } from "@nestjs/common";

// The unified/remark/rehype ecosystem is ESM-only and Vercel's runtime cannot require() ESM.
// With `module: node16` TypeScript keeps these import() calls native in the CommonJS build.
function loadMarkdownToolchain() {
  return Promise.all([
    import("mdast-util-to-string"),
    import("rehype-sanitize"),
    import("rehype-slug"),
    import("rehype-stringify"),
    import("remark-parse"),
    import("remark-rehype"),
    import("unified"),
    import("unist-util-visit"),
  ]).then(
    ([
      { toString },
      { default: rehypeSanitize },
      { default: rehypeSlug },
      { default: rehypeStringify },
      { default: remarkParse },
      { default: remarkRehype },
      { unified },
      { visit },
    ]) => ({
      rehypeSanitize,
      rehypeSlug,
      rehypeStringify,
      remarkParse,
      remarkRehype,
      toString,
      unified,
      visit,
    }),
  );
}

let markdownToolchain: ReturnType<typeof loadMarkdownToolchain> | undefined;

export interface MarkdownHeading {
  depth: number;
  id: string;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  tableOfContents: MarkdownHeading[];
}

function slugifyHeading(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}

@Injectable()
export class MarkdownRendererService {
  async render(markdown: string): Promise<RenderedMarkdown> {
    markdownToolchain ??= loadMarkdownToolchain();
    const {
      rehypeSanitize,
      rehypeSlug,
      rehypeStringify,
      remarkParse,
      remarkRehype,
      toString,
      unified,
      visit,
    } = await markdownToolchain;
    const markdownTree = unified().use(remarkParse).parse(markdown);
    const tableOfContents: MarkdownHeading[] = [];

    visit(markdownTree, "heading", (node) => {
      const text = toString(node).trim();

      if (text) {
        tableOfContents.push({
          depth: node.depth,
          id: slugifyHeading(text),
          text,
        });
      }
    });

    const html = String(
      await unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeSlug)
        .use(rehypeSanitize)
        .use(rehypeStringify)
        .process(markdown),
    );

    return { html, tableOfContents };
  }
}
