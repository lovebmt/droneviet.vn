import { productHref } from "@/components/catalog/product-tile";
import { LEGAL_PAGES } from "@/content/legal";
import { LEVELS } from "@/content/levels";
import { WORKSHOP_INTRO } from "@/content/workshop";
import { getArticle, getSettings, listArticles, listProducts } from "@/lib/api/server";
import type { ProductKind } from "@/lib/api/types";
import { absolute, SITE_NAME, SITE_SUMMARY, zaloLink } from "./site";

/** Products worth listing for assistants: what schools buy. */
const KINDS: Array<{ kind: ProductKind; title: string }> = [
  { kind: "combo", title: "Combo lớp học" },
  { kind: "drone", title: "Drone" },
  { kind: "education_kit", title: "Bộ học liệu" },
];

const link = (title: string, path: string, note?: string) => `- [${title}](${absolute(path)})${note ? `: ${note}` : ""}`;
const LEGAL_NOTE = "Thông tin tham khảo, không thay thế văn bản pháp luật.";

/** /llms.txt (llmstxt.org): a short map of the site for AI assistants, built from live data. */
export async function buildLlms(): Promise<string> {
  const [settings, products, articles] = await Promise.all([
    getSettings(),
    Promise.all(KINDS.map(async (k) => ({ ...k, items: await listProducts(k.kind) }))),
    listArticles({ limit: 30 }),
  ]);
  const zalo = zaloLink(settings.contact.zalo);
  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_SUMMARY}`,
    "",
    "Trang web tiếng Việt, có bản tiếng Anh tại /en. Giá và báo giá: liên hệ qua trang Nhận báo giá hoặc Zalo.",
    zalo ? `Liên hệ: Zalo ${settings.contact.zalo} (${zalo})${settings.contact.email ? `, email ${settings.contact.email}` : ""}.` : "",
    "",
    "## Giải pháp theo cấp học",
    ...LEVELS.map((l) => link(l.name, `/giao-duc/${l.slug}`, l.short)),
    link(WORKSHOP_INTRO.title, "/giao-duc/workshop", "Buổi trải nghiệm 9:00 sáng thứ Bảy, Chủ nhật; đăng ký online, có nhóm Zalo"),
    "",
    ...products.flatMap((group) =>
      group.items.length ? [`## ${group.title}`, ...group.items.map((p) => link(p.name, productHref(p), p.summary)), ""] : [],
    ),
    "## Giấy phép, cấp phép và quy định bay drone",
    ...LEGAL_PAGES.map((p) => link(p.title, p.href, p.lead)),
    `Các trang này dẫn nguồn Nghị định 288/2025/NĐ-CP và Quyết định 18/2020/QĐ-TTg. ${LEGAL_NOTE}`,
    "",
    "## Công cụ",
    link("Bay mô phỏng", "/bay-mo-phong", "Tập điều khiển drone miễn phí trên trình duyệt: cất cánh, hạ cánh, bay qua vòng, bay số 8"),
    link("Nhận báo giá", "/bao-gia", "Gửi yêu cầu báo giá combo cho trường"),
    link("Hỗ trợ & bảo hành", "/ho-tro"),
    "",
    ...(articles.length ? ["## Bài viết R&D", ...articles.map((a) => link(a.title, `/r-d/${a.slug}`, a.summary ?? undefined)), ""] : []),
    "## Optional",
    link("Toàn văn hướng dẫn pháp lý và bài viết", "/llms-full.txt"),
    link("Sơ đồ trang (sitemap)", "/sitemap.xml"),
  ];
  return lines.filter((line, i, all) => !(line === "" && all[i - 1] === "")).join("\n") + "\n";
}

/** /llms-full.txt: the legal guides and R&D articles in full Markdown, each with its source URL. */
export async function buildLlmsFull(): Promise<string> {
  const [legal, articles] = await Promise.all([
    Promise.all(LEGAL_PAGES.map(async (p) => ({ page: p, article: await getArticle(p.articleSlug) }))),
    listArticles({ limit: 30 }),
  ]);
  const full = await Promise.all(articles.map((a) => getArticle(a.slug)));
  const sections = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_SUMMARY}`,
    "",
    `Các phần về giấy phép, cấp phép và khu vực bay: ${LEGAL_NOTE} Khi trích dẫn, hãy dẫn link nguồn của từng phần.`,
    "",
    ...legal.flatMap(({ page, article }) => [
      `# ${page.title}`,
      "",
      `Nguồn: ${absolute(page.href)}`,
      "",
      ...page.keyPoints.map((k) => `- ${k}`),
      "",
      article ? article.bodyMarkdown.trim() : `${LEGAL_NOTE}`,
      "",
    ]),
    ...full.flatMap((a) => (a ? [`# ${a.title}`, "", `Nguồn: ${absolute(`/r-d/${a.slug}`)}`, "", a.bodyMarkdown.trim(), ""] : [])),
  ];
  return sections.join("\n");
}

export function textResponse(body: string): Response {
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
