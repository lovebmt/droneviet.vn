// Publishing helpers for R&D articles (spec §9.4–9.5). Pure functions + one orchestrator with
// injectable fetch/readFile so it is fully testable without a network.
import { basename, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

export const MAX_BYTES = 4 * 1024 * 1024;
const MIME = { ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".pdf": "application/pdf" };
const IMAGE_LINK = /!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g;
const FILE_DIRECTIVE = /::file\{([^}]*)\}/g;

export const isLocal = (path) => typeof path === "string" && path.length > 0 && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(path);

export function mimeOf(path) {
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? MIME[path.slice(dot).toLowerCase()] : undefined;
}

/** Front matter (YAML between --- lines) + Markdown body. */
export function parseArticle(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) throw new Error("Bài viết cần phần front matter giữa hai dòng ---");
  const meta = parseYaml(match[1]) ?? {};
  return { meta, body: source.slice(match[0].length).replace(/^\s+/, "") };
}

function fileSrc(attrs) {
  return /(?:^|\s)src=("([^"]+)"|(\S+))/.exec(attrs)?.slice(2).find(Boolean);
}

/** Relative paths to upload: cover, attachments, inline images and ::file{src=…}. Each once. */
export function localAssets(meta, body) {
  const found = new Set();
  if (isLocal(meta.cover)) found.add(meta.cover);
  for (const a of meta.attachments ?? []) if (isLocal(a?.src)) found.add(a.src);
  for (const m of body.matchAll(IMAGE_LINK)) if (isLocal(m[2])) found.add(m[2]);
  for (const m of body.matchAll(FILE_DIRECTIVE)) {
    const src = fileSrc(m[1]);
    if (isLocal(src)) found.add(src);
  }
  return [...found];
}

export function rewriteBody(body, urls) {
  return body
    .replace(IMAGE_LINK, (all, alt, path, title = "") => (urls.has(path) ? `![${alt}](${urls.get(path)}${title})` : all))
    .replace(FILE_DIRECTIVE, (all, attrs) => {
      const src = fileSrc(attrs);
      if (!src || !urls.has(src)) return all;
      return `::file{${attrs.replace(/(^|\s)src=("[^"]+"|\S+)/, `$1url=${urls.get(src)}`)}}`;
    });
}

const list = (v) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);
const url = (v, urls) => (v ? (urls.get(v) ?? v) : null);

export function buildPayload(meta, body, urls) {
  if (!meta.title) throw new Error("Thiếu title trong front matter");
  return {
    title: String(meta.title),
    summary: meta.summary ? String(meta.summary) : null,
    kind: meta.kind ?? "guide",
    locale: meta.locale ?? "vi",
    tags: list(meta.tags),
    levels: list(meta.levels),
    coverImageUrl: url(meta.cover, urls),
    relatedProductSlugs: list(meta.related),
    attachments: (meta.attachments ?? []).map((a) => ({ url: url(a.src ?? a.url, urls), label: String(a.label ?? basename(a.src ?? a.url)) })),
    seoTitle: meta.seoTitle ?? null,
    seoDescription: meta.seoDescription ?? meta.summary ?? null,
    bodyMarkdown: rewriteBody(body, urls),
  };
}

async function call(fetchImpl, api, token, method, path, body) {
  const response = await fetchImpl(`${api}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(typeof body === "string" ? { "content-type": "application/json" } : {}) },
    body,
  });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = Array.isArray(data.message) ? data.message.join(", ") : (data.message ?? message);
    } catch {}
    throw new Error(`${method} ${path}: ${message}`);
  }
  return response.json().catch(() => ({}));
}

/**
 * Validates every local file first (exists, allowed type, ≤4 MB) so a bad path never leaves a
 * half-published article; then uploads each once, upserts by slug, and optionally publishes.
 */
export async function publishArticle(dir, opts) {
  const source = await opts.readText(join(dir, "index.md"));
  const { meta, body } = parseArticle(source);
  const slug = meta.slug ?? basename(resolve(dir));
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Slug không hợp lệ: ${slug}`);

  const assets = localAssets(meta, body);
  const files = new Map();
  for (const rel of assets) {
    const mime = mimeOf(rel);
    if (!mime) throw new Error(`Định dạng không được hỗ trợ: ${rel} (chỉ WebP, AVIF, PNG, JPEG, SVG, PDF)`);
    let bytes;
    try {
      bytes = await opts.readFile(join(dir, rel));
    } catch {
      throw new Error(`Không tìm thấy tệp: ${rel}`);
    }
    if (bytes.byteLength > MAX_BYTES) throw new Error(`Tệp lớn hơn 4 MB: ${rel}. Hãy nén (WebP) trước khi đăng.`);
    files.set(rel, { bytes, mime });
  }

  if (opts.dryRun) {
    return { slug, uploaded: [], payload: buildPayload(meta, body, new Map()) };
  }
  if (!opts.token) throw new Error("Thiếu khóa đăng bài. Đặt DRONEVIET_CONTENT_TOKEN hoặc lưu vào Keychain cùng tên.");

  const urls = new Map();
  for (const [rel, { bytes, mime }] of files) {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: mime }), basename(rel));
    if (mime.startsWith("image/")) form.append("alt", (meta.title ?? "").toString());
    if (meta.imageSource) form.append("source", String(meta.imageSource));
    const media = await call(opts.fetch, opts.api, opts.token, "POST", "/admin/media", form);
    urls.set(rel, media.url);
  }

  const payload = buildPayload(meta, body, urls);
  await call(opts.fetch, opts.api, opts.token, "PUT", `/admin/content/articles/${slug}`, JSON.stringify(payload));
  if (opts.publish) await call(opts.fetch, opts.api, opts.token, "POST", `/admin/content/articles/${slug}/publish`);
  return { slug, uploaded: [...urls.entries()], payload };
}
