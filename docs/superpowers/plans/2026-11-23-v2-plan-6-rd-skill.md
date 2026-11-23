# v2 Plan 6 — R&D Publishing Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Claude (or the owner) writes an R&D article as a Markdown file in the repo and publishes it, with images, PDF attachments, YouTube and product cards, through the API — no deploy.
**Architecture:** `scripts/rd/` Node ESM: `lib.mjs` (parse front matter, find local images/files, rewrite links, build the `PUT /admin/content/articles/:slug` payload) and `publish.mjs` CLI (token from `DRONEVIET_CONTENT_TOKEN` env or Keychain, uploads to `/admin/media`, upserts, optional `--publish`, `--dry-run`). Article sources in `content/rd/<slug>/index.md` with images beside them. Skill `.claude/skills/write-rd-article/SKILL.md` documents voice, structure, directives, image rules and the commands.
**Spec:** §9.4, §9.5.

## Global Constraints
- Directives the web renders: `::youtube{id=…}`, `::product{slug=…}`, `:::note` / `:::warning`, `::file{url=… label=…}` (Ruling: spec says `media=`, the renderer shipped in Plan 3 takes `url=`; the script turns `::file{src=./x.pdf}` into `url=` after upload).
- Only WebP/AVIF/PNG/JPEG/SVG images and PDF, ≤4 MB; the script refuses others before uploading. Never print the token.
- AI draws only diagrams (SVG); photos come from the owner or licensed sources, credited in alt or caption.

## Review Focus
1. Image path that does not exist → clear error naming the file, nothing uploaded or saved. → Task 1
2. Same image used twice → uploaded once. → Task 1
3. Re-running publish on an unchanged article → upsert, no duplicate article (slug is the key). → Task 1
4. Token missing → message telling how to set it, exit code 1. → Task 1
5. Remote (`https://`) image URLs are left as they are. → Task 1

---

### Task 1: Publishing library and CLI
**Files:** `scripts/rd/{lib.mjs,publish.mjs}`, `scripts/rd/lib.test.ts`; `package.json` script `rd:publish`.
**Produces:** `parseArticle(source): {meta, body}`; `localAssets(meta, body): string[]` (relative paths of images, cover, `::file{src=}` and attachments); `rewriteBody(body, urls: Map<string,string>)`; `buildPayload(meta, body, urls)`; `publishArticle(dir, {api, token, publish, dryRun, fetch, readFile})`.
- Tests: `front matter maps to the API payload`; `local images, cover and files are uploaded once and links rewritten`; `remote image URLs are untouched`; `a missing file stops before any upload`; `unsupported file type is refused`; `--publish calls the publish endpoint after the upsert`. Commit `feat(rd): article publishing script`.

### Task 2: Skill and imported articles
**Files:** `.claude/skills/write-rd-article/SKILL.md`, `content/rd/<slug>/index.md` for the 4 existing articles (vi ×2, en ×2), remove `backend/src/database/import/articles/`.
**Produces:** skill doc; articles converted to the new front matter; dry-run of each passes; local API import published and visible at `/r-d/<slug>`.
- Verification: `npm run rd:publish -- content/rd/<slug> --dry-run` for each → payload printed; local publish → `/r-d/<slug>` 200. Commit `feat(rd): write-rd-article skill and imported articles`.
