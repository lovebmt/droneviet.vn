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
