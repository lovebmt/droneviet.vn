# v2 Plan 7 — QA and Cutover Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. The production steps (Task 3) need the owner's explicit go-ahead.

**Goal:** Prove the branch works end to end, review it as a whole, then switch production in one deploy with a rollback path.
**Spec:** §13.

## Review Focus
1. A journey that unit tests mock (quote, cart → checkout, sign-up → account, admin confirm) fails against the real API. → Task 1
2. Old indexed URLs stop resolving. → Task 1
3. Pages fail basic accessibility (missing names, contrast) or overflow at 390 px. → Task 1
4. Production env missing a variable the API requires (R2, revalidate secret) → API refuses to boot. → Task 3
5. Old accounts or orders unreadable after migration. → Task 3 smoke test

### Task 1: End-to-end suite (local)
**Files:** `playwright.config.ts`, `e2e/*.spec.ts`, `package.json` script `e2e`.
- Journeys: quote request; buy a drone with COD then staff confirms it in admin; sign up then see account and order list; R&D article with TOC; simulator loads engine only after start; legacy redirects; no horizontal overflow at 390 px; axe (wcag2a/aa) with no serious/critical violations on key pages.
- Commit `test(e2e): end-to-end journeys, redirects, overflow and accessibility`.

### Task 2: Whole-branch review
- Self-review (no subagent requested) of `main..rewrite/v2` against spec and the Review Focus lists of Plans 1–7; Critical/Important fixed with a failing test first.

### Task 3: Cutover (owner approval required)
- Preview on a Neon branch → owner review → set production env on `droneviet-api` (COOKIE_DOMAIN, CONTENT_PUBLISH_TOKEN, R2_*, WEB_REVALIDATE_URL/SECRET, RUN_SEED=1) and `droneviet-vn` (WEB_REVALIDATE_SECRET) → merge `rewrite/v2` into `main` → smoke test → publish R&D articles with `npm run rd:publish -- … --publish` → remove RUN_SEED → keep Instant Rollback ready.

---

## Cutover runbook (prepared 2026-11-23, waiting for the owner's go-ahead)

Secrets are ready: Keychain `DRONEVIET_CONTENT_TOKEN`, `DRONEVIET_WEB_REVALIDATE_SECRET` (also in `~/.config/droneviet/secrets.env`), R2 keys in the same file.
Already correct on `droneviet-api`: CORS_ORIGIN (apex + www), FRONTEND_URL, PUBLIC_API_URL, PAYOS_RETURN_URL/CANCEL_URL, ZALO_REDIRECT_URI.

**Finding:** `DATABASE_URL`/`DATABASE_URL_UNPOOLED` on `droneviet-api` target preview *and* production. A preview deploy would migrate the production database.

### A. Optional preview (spec §13.1)
1. Create Neon branch `v2-preview` from production; set preview-only `DATABASE_URL`, `DATABASE_URL_UNPOOLED` to it (remove `preview` from the production ones).
2. Preview env on `droneviet-api`: COOKIE_DOMAIN unset (cookies stay on the preview host), CONTENT_PUBLISH_TOKEN, R2_*, RUN_SEED=1; on `droneviet-vn` preview: NEXT_PUBLIC_COMMERCE_API_URL = API preview URL.
3. `git push origin rewrite/v2` → both projects build previews → run `E2E_BASE_URL=<web preview> E2E_API_URL=<api preview> npm run e2e`.

### B. Production (one deploy)
1. Env on `droneviet-api` (production): COOKIE_DOMAIN=.droneviet.vn, CONTENT_PUBLISH_TOKEN, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET=droneviet-media, WEB_REVALIDATE_URL=https://www.droneviet.vn/api/revalidate, WEB_REVALIDATE_SECRET, RUN_SEED=1.
2. Env on `droneviet-vn` (production): WEB_REVALIDATE_SECRET (same value).
3. Neon: create a backup branch of production right before merging (rollback point for data).
4. Merge `rewrite/v2` → `main`, push. Wait until `droneviet-api` is READY (build runs additive migrations + seed-v2 + seed-admin).
5. If the `droneviet-vn` build failed or finished before the API (it prerenders against the API), redeploy `droneviet-vn` — a failed build never replaces the live site.
6. Publish R&D: `npm run rd:publish -- content/rd/drone-giao-duc-stem content/rd/giao-trinh-drone-theo-cap-hoc --publish`.
7. Smoke test production: home, combo + quote, buy a drone to the PayOS page (cancel), COD order + confirm in admin, sign in with Google/Zalo/email, my orders, R&D article, simulator, admin pages; old accounts and orders still listed. Then `E2E_BASE_URL=https://www.droneviet.vn E2E_API_URL=https://api.droneviet.vn npx playwright test e2e/quality.spec.ts`.
8. Remove RUN_SEED from `droneviet-api`.
9. Rollback: Vercel Instant Rollback on both projects (migrations are additive); data rollback from the Neon backup branch only if needed.
