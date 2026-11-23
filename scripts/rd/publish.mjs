#!/usr/bin/env node
// Usage: npm run rd:publish -- content/rd/<slug> [--publish] [--dry-run] [--api https://api.droneviet.vn]
// Token: DRONEVIET_CONTENT_TOKEN env, else macOS Keychain item of the same name. Never printed.
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { publishArticle } from "./lib.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dirs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--api");

if (!dirs.length) {
  console.error("Cách dùng: npm run rd:publish -- content/rd/<slug> [--publish] [--dry-run] [--api URL]");
  process.exit(1);
}

function token() {
  if (process.env.DRONEVIET_CONTENT_TOKEN) return process.env.DRONEVIET_CONTENT_TOKEN;
  try {
    return execFileSync("security", ["find-generic-password", "-s", "DRONEVIET_CONTENT_TOKEN", "-w"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const api = (option("--api") ?? process.env.DRONEVIET_API_URL ?? "https://api.droneviet.vn").replace(/\/$/, "");
const dryRun = flag("--dry-run");
let failed = false;

for (const dir of dirs) {
  try {
    const result = await publishArticle(dir, {
      api,
      token: dryRun ? "" : token(),
      publish: flag("--publish"),
      dryRun,
      fetch: globalThis.fetch,
      readFile: (p) => readFile(p),
      readText: (p) => readFile(p, "utf8"),
    });
    if (dryRun) {
      console.log(JSON.stringify({ slug: result.slug, ...result.payload, bodyMarkdown: `${result.payload.bodyMarkdown.slice(0, 200)}…` }, null, 2));
    } else {
      console.log(`${flag("--publish") ? "Đã đăng" : "Đã lưu bản nháp"}: ${result.slug} (${result.uploaded.length} tệp đã tải lên) → ${api}`);
      if (flag("--publish")) console.log(`Xem: https://www.droneviet.vn/r-d/${result.slug}`);
    }
  } catch (error) {
    failed = true;
    console.error(`${dir}: ${error instanceof Error ? error.message : error}`);
  }
}
process.exit(failed ? 1 : 0);
