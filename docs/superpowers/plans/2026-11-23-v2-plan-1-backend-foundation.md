# v2 Plan 1 — Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the NestJS API everything the v2 web needs: one rich product catalog with combos, R2 media, an article publishing API with its own token, cookie sessions, "my orders/courses", site settings and the quote/course/simulator data.

**Architecture:** Extend existing modules (catalog, content, auth, orders, quotes, courses) with additive TypeORM migrations generated against local Postgres. New small modules: `media` (R2 through a `MediaStorage` port), `settings`, `simulator`. Web cache invalidation is a fire-and-forget POST to the web app.

**Tech Stack:** NestJS 10, TypeORM 0.3 + Postgres (Neon), Vitest, `@aws-sdk/client-s3` (R2 S3 API), `cookie-parser`, `@nestjs/platform-express` file upload.

**Spec:** `docs/superpowers/specs/2026-11-23-droneviet-v2-rewrite-design.md` (§9, §16); roadmap `docs/superpowers/plans/2026-11-23-v2-roadmap.md`.

## Global Constraints

- Work on branch `rewrite/v2`; do not push to `main`, do not deploy production.
- Migrations are **additive only** (no dropped/renamed columns or tables); generate with `DATABASE_URL=postgres://droneviet:droneviet@localhost:5433/droneviet npx typeorm-ts-node-commonjs migration:generate src/database/migrations/<Name> -d src/database/data-source.ts`, register in `data-source.ts`, bump `data-source.spec.ts` migration count.
- TDD: failing test first. Full suite: `cd backend && TEST_DATABASE_URL=postgres://droneviet:droneviet@localhost:5433/droneviet npx vitest run --config vitest.config.mts`; plus `npm run build`.
- TypeScript `module: node16`: ESM-only packages only via `await import()`; relative dynamic imports need `.js`.
- Request body limit on Vercel ≈ 4.5MB → media upload max **4 MB**.
- No secrets in the repo; new env vars documented in `backend/.env.example`.
- Placeholder content rule (spec §16): placeholders live in the database, never invented prices — combos without tiers show "Liên hệ báo giá".
- Commits authored as `lovebmt`; end messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. A file renamed to `.png` that is not an image → rejected with 400 (magic-byte check), never stored. → Task 3
2. Upload larger than 4 MB → 413 with a clear message. → Task 3
3. Browser on `https://www.droneviet.vn` calling the API with `credentials: "include"` → session cookie `Secure; HttpOnly; SameSite=Lax; Domain=.droneviet.vn`; on localhost no `Domain` and no `Secure`. → Task 5
4. Unknown or draft product slug → 404 (not 500); a combo never exposes items whose product is unpublished. → Task 1
5. Web revalidation endpoint down or slow → publishing still succeeds (logged, 3 s timeout). → Tasks 2 and 4

---

### Task 1: Rich catalog + combos (public API)

**Files:**
- Modify: `backend/src/catalog/entities/product.entity.ts`, `backend/src/catalog/catalog.service.ts`, `backend/src/catalog/catalog.controller.ts`
- Create: `backend/src/catalog/entities/combo-item.entity.ts`, `backend/src/catalog/entities/combo-size-tier.entity.ts`, `backend/src/catalog/catalog-public.types.ts`, migration `CatalogV2`
- Test: `backend/src/catalog/catalog-v2.integration.spec.ts` (gated on `TEST_DATABASE_URL`, same pattern as `src/postgres.integration.spec.ts`)

**Interfaces:**
- Produces: `ProductKind` gains `COMBO = "combo"`, `PART = "part"` (existing values kept). New `Product` columns (all nullable/defaulted): `levels: string[]` (json, default `[]`, values `tieu-hoc|thcs|thpt|dai-hoc|quoc-te`), `gallery: Array<{url:string;alt:string}>` (json `[]`), `specs: Array<{group:string;items:Array<{label:string;value:string}>}>` (json `[]`), `inTheBox: string[]`, `faq: Array<{q:string;a:string}>`, `compatibleWith: string[]` (slugs), `brochureUrl: string|null`, `seoTitle`, `seoDescription`, `badge: string|null` ("Mới", "Bán chạy"), `sortOrder: int default 0`, `featured: boolean default false`, `summaryEn`, `nameEn` (nullable, for §16 EN pages).
- `ComboItem { id; comboId; productId; quantity:int; note:string|null; sortOrder:int }`, `ComboSizeTier { id; comboId; students:int; priceVnd:bigint; label:string|null }`.
- `GET /catalog/products?kind=&level=&featured=` → `PublicProductCard[]` = `{ slug, name, nameEn, summary, kind, levels, coverImageUrl, badge, fromPriceVnd: number|null, purchaseMode, inStock: boolean, featured }` (published only, ordered by `sortOrder`, then name). For combos `fromPriceVnd` = min tier price or `null`.
- `GET /catalog/products/:slug` → `PublicProductDetail` = card fields + `gallery, specs, inTheBox, faq, brochureUrl, seoTitle, seoDescription, variants:[{id, sku, title, priceVnd, compareAtVnd, purchaseMode, stock:number}], compatible: PublicProductCard[], comboItems: [{product: PublicProductCard, quantity, note}], sizeTiers: [{students, priceVnd, label}]`.

- [ ] **Step 1: Failing tests** in `catalog-v2.integration.spec.ts`: `lists only published products filtered by kind and level`; `combo card fromPriceVnd is the cheapest tier, or null without tiers`; `detail returns gallery, specs, variants with stock and combo items with quantities`; `combo detail omits items whose product is a draft` (Review Focus 4); `unknown or draft slug returns 404` (Review Focus 4).
- [ ] **Step 2:** Run → FAIL (columns/route missing).
- [ ] **Step 3:** Entities + migration `CatalogV2` (`ALTER TYPE ... ADD VALUE 'combo'`, `'part'` included by generation or written manually), service `listPublic(filter)` and `getPublicDetail(slug)` (throw `NotFoundException`), controller routes.
- [ ] **Step 4:** Full suite + build → PASS.
- [ ] **Step 5:** Commit `feat(catalog): rich product detail and combos`.

### Task 2: Admin catalog editing

**Files:**
- Modify: `backend/src/catalog/admin-catalog.controller.ts`, `backend/src/catalog/catalog.service.ts`, `backend/src/catalog/dto/create-product.dto.ts`
- Create: `backend/src/catalog/dto/update-product.dto.ts`, `backend/src/catalog/dto/combo.dto.ts`, `backend/src/common/web-revalidator.ts`
- Test: `backend/src/catalog/catalog-v2.integration.spec.ts` (add cases), `backend/src/common/web-revalidator.spec.ts`

**Interfaces:**
- Consumes: Task 1 entities.
- Produces: `WebRevalidator.revalidate(tags: string[]): Promise<void>` (injectable, in a global `CommonModule`) → `POST ${WEB_REVALIDATE_URL}` body `{tags}` header `x-revalidate-secret: ${WEB_REVALIDATE_SECRET}`, 3 s timeout, never throws (logs); no-op when `WEB_REVALIDATE_URL` unset.
- Produces (role `super_admin|catalog_manager`, existing `JwtAuthGuard`+`RolesGuard`): `GET /admin/catalog/products` (all statuses, with variants+stock), `PATCH /admin/catalog/products/:id` (`UpdateProductDto`: every Task 1 column + `name, summary, status, coverImageUrl, kind`), `PATCH /admin/catalog/variants/:id` (`priceVnd, compareAtVnd, purchaseMode, isActive, stock`), `PUT /admin/catalog/products/:id/combo-items` (replace list `[{productSlug, quantity, note}]`), `PUT /admin/catalog/products/:id/size-tiers` (replace list `[{students, priceVnd, label}]`). Every successful write calls `WebRevalidator.revalidate(["catalog", "product:<slug>"])`.

- [ ] **Step 1: Failing tests:** `revalidator posts tags with the secret`; `revalidator swallows network errors and timeouts` (Review Focus 5); `admin can update specs and see them in public detail`; `replacing combo items rejects unknown product slugs with 400`; `size tiers must have positive students and price`; `customer role gets 403`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** DTOs with class-validator (nested arrays validated), service methods `updateProduct`, `updateVariant`, `replaceComboItems`, `replaceSizeTiers` in one transaction each.
- [ ] **Step 4:** Suite + build → PASS. **Step 5:** Commit `feat(catalog): admin editing for products, variants and combos`.

### Task 3: Media on Cloudflare R2

**Files:**
- Create: `backend/src/media/media.module.ts`, `media.entity.ts`, `media.service.ts`, `media-storage.ts` (port + `R2MediaStorage` + `MemoryMediaStorage` for tests), `media.controller.ts` (public GET), `admin-media.controller.ts`, `sniff-mime.ts`, specs alongside; migration `Media`
- Modify: `backend/src/app.module.ts`, `backend/.env.example`, `backend/package.json` (`@aws-sdk/client-s3`)

**Interfaces:**
- Produces: `interface MediaStorage { put(key: string, body: Buffer, contentType: string): Promise<void>; get(key: string): Promise<{ body: Buffer; contentType: string } | null> }`; `MEDIA_STORAGE` injection token. `Media { id: uuid; key: string; filename: string; mime: string; bytes: int; width: int|null; height: int|null; alt: string|null; source: string|null; createdAt }`.
- `POST /admin/media` (multipart field `file`, plus `alt`, `source`; auth: admin roles **or** content token from Task 4) → `{ id, url: "https://api.droneviet.vn/media/<id>/<filename>", mime, bytes }` (base from `PUBLIC_API_URL`).
- `GET /media/:id/:filename` → bytes with `Content-Type`, `Cache-Control: public, max-age=31536000, immutable`; 404 when missing.
- Allowed mimes (by magic bytes, not extension): `image/webp, image/avif, image/png, image/jpeg, image/svg+xml` (SVG: reject if it contains `<script` or `on\w+=`), `application/pdf`. Max 4 MB → 413.
- Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=droneviet-media`. Provisioning (bucket + S3 credentials) is an infra step in Step 5; if the Cloudflare token cannot mint R2 credentials, ask the owner to create an R2 API token in the dashboard.

- [ ] **Step 1: Failing tests** (`MemoryMediaStorage`): `stores a webp and serves it with immutable caching`; `rejects a text file renamed .png with 400` (Review Focus 1); `rejects 4 MB + 1 byte with 413` (Review Focus 2); `rejects svg containing script`; `GET unknown id returns 404`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (`FileInterceptor` with `limits.fileSize`, map multer `LIMIT_FILE_SIZE` to 413).
- [ ] **Step 4:** Suite + build → PASS.
- [ ] **Step 5 (infra):** Create bucket `droneviet-media` via Cloudflare API; obtain S3 credentials; store in Keychain `DRONEVIET_R2_ACCESS_KEY_ID` / `DRONEVIET_R2_SECRET_ACCESS_KEY` and in `~/.config/droneviet/secrets.env`; smoke test `R2MediaStorage` put/get from local. Commit `feat(media): R2-backed media uploads`.

### Task 4: Content publishing API, token and web revalidation

**Files:**
- Modify: `backend/src/content/entities/article.entity.ts`, `content.service.ts`, `admin-content.controller.ts`, `content.module.ts`
- Create: `backend/src/content/content.controller.ts` (public), `backend/src/auth/content-token.guard.ts`, migration `ContentV2`
- Test: `backend/src/content/content-v2.integration.spec.ts`, `backend/src/auth/content-token.guard.spec.ts`

**Interfaces:**
- Produces: `Article` new columns: `tags: string[]` (json `[]`), `levels: string[]`, `attachments: Array<{url;label}>` (json `[]`), `relatedProductSlugs: string[]`, `kind: "guide"|"research"|"news"` (default `guide`), `readingMinutes: int|null`.
- `ContentTokenGuard`: passes when `Authorization: Bearer <CONTENT_PUBLISH_TOKEN>` (timingSafeEqual) **or** an admin JWT/cookie with role `super_admin`; env `CONTENT_PUBLISH_TOKEN` unset → token path always rejects.
- `PUT /admin/content/articles/:slug` (upsert draft: title, summary, bodyMarkdown, coverImageUrl, seoTitle, seoDescription, tags, levels, attachments, relatedProductSlugs, kind) → article; `POST /admin/content/articles/:slug/publish`; `POST /admin/content/articles/:slug/unpublish`; `GET /admin/content/articles` (all).
- Public: `GET /content/articles?tag=&level=&limit=` → `[{slug,title,summary,coverImageUrl,tags,levels,kind,publishedAt,readingMinutes}]` (published, newest first); `GET /content/articles/:slug` → those + `bodyMarkdown, attachments, relatedProducts: PublicProductCard[], seoTitle, seoDescription` (404 if not published). Markdown is rendered on the web (spec §9.4).
- Consumes `WebRevalidator` (Task 2): called on publish/unpublish with `["articles","article:<slug>"]`; a failed revalidation never fails the publish (Review Focus 5).

- [ ] **Step 1: Failing tests:** `token can upsert and publish an article that then appears publicly`; `wrong or missing token gets 401; unset CONTENT_PUBLISH_TOKEN rejects every token`; `draft article is 404 publicly`; `publish still succeeds when the revalidator rejects` (Review Focus 5).
- [ ] **Step 2:** FAIL. **Step 3:** Implement; also allow the content token on `POST /admin/media` (Task 3).
- [ ] **Step 4:** Suite + build → PASS. **Step 5:** Commit `feat(content): publishing API with content token and web revalidation`.

### Task 5: Cookie sessions

**Files:**
- Modify: `backend/src/main.ts` (cookie-parser), `backend/src/auth/auth.controller.ts`, `auth.service.ts`, `jwt-auth.guard.ts`, `oauth.controller.ts`
- Create: `backend/src/auth/session-cookie.ts`, `backend/src/auth/optional-auth.guard.ts`
- Test: `backend/src/auth/session-cookie.spec.ts`, `backend/src/auth/session.integration.spec.ts`

**Interfaces:**
- Produces: `sessionCookieOptions(env): CookieOptions` → `{ httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 days, secure: NODE_ENV==="production", domain: COOKIE_DOMAIN || undefined }`; cookie name `dv_session` (JWT, `expiresIn: "7d"`).
- `POST /auth/login`, `POST /auth/register`, `POST /auth/oauth/exchange` set the cookie and return `{ user }` (and still `accessToken` for admin compatibility). `GET /auth/me` → `{ id, email, displayName, roles }` or 401. `POST /auth/logout` clears it. `JwtAuthGuard` accepts Bearer **or** `dv_session` cookie; `OptionalAuthGuard` sets `request.user` when present, never rejects.
- Env: `COOKIE_DOMAIN=.droneviet.vn` (production only).

- [ ] **Step 1: Failing tests:** `production cookie options are Secure, HttpOnly, Lax, Domain .droneviet.vn`; `local options have no domain and no secure` (Review Focus 3); `login sets dv_session and /auth/me reads it`; `logout clears the cookie`; `guard accepts cookie without Authorization header`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** Suite + build → PASS. **Step 5:** Commit `feat(auth): cookie sessions with /auth/me and logout`.

### Task 6: My orders, my courses, order fixes

**Files:**
- Modify: `backend/src/orders/entities/order.entity.ts`, `orders.service.ts`, `orders.controller.ts`, `dto/create-order.dto.ts`, `backend/src/courses/courses.service.ts`
- Create: `backend/src/me/me.module.ts`, `me.controller.ts`, migration `OrdersUser`
- Test: `backend/src/me/me.integration.spec.ts`, `backend/src/orders/orders.controller.spec.ts` (add)

**Interfaces:**
- Produces: `Order.userId: uuid|null` (FK users, `ON DELETE SET NULL`). `POST /orders` uses `OptionalAuthGuard`: when signed in, `userId` is set.
- `GET /me/orders` → `[{orderNumber,status,totalVnd,createdAt,lines:[{title,quantity,subtotalVnd}]}]` newest first; `GET /me/orders/:orderNumber` (404 if not the caller's); `GET /me/courses` → enrollments with course + session.
- Fixes: `GET /orders/:orderNumber` without `phone` → 400; `CreateOrderDto` lines require `@IsUUID()` `variantId` → 400 on empty.

- [ ] **Step 1: Failing tests:** `order created while signed in appears in /me/orders`; `guest order is not listed for anyone`; `another user's order number is 404`; `lookup without phone is 400`; `empty variantId is 400`.
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** Commit `feat(me): my orders and courses; validation fixes`.

### Task 7: Site settings, quotes v2, courses v2, simulator results

**Files:**
- Create: `backend/src/settings/` (module, entity, controller, admin controller), `backend/src/simulator/` (module, entity, controller), migration `SettingsQuotesCoursesSim`
- Modify: `backend/src/quotes/entities/quote-request.entity.ts`, quote DTO/service; `backend/src/courses/entities/course.entity.ts`, courses service/controller
- Test: `backend/src/settings/settings.integration.spec.ts`, `backend/src/simulator/simulator.integration.spec.ts`, quotes/courses spec additions

**Interfaces:**
- `SiteSetting { key: string (pk); value: json }`. `GET /settings/public` → `{ contact: { zalo, phone, email, address, companyName }, announcement: { text, href } | null }` (defaults: zalo `0384070636`, others `null`). `PATCH /admin/settings/:key` (super_admin), revalidates `["settings"]`.
- Quote: new nullable `productSlug`, `students:int`, `organizationType` (`school|center|university|company|other`); quote created → audit + email hook unchanged.
- Course: new `level` (`co-ban|nang-cao|chung-chi`), `format` (`truc-tiep|online|ket-hop`), `durationHours:int`, `descriptionMarkdown`, `certificateTrack: string|null`; public `GET /courses` and `GET /courses/:slug` (with upcoming sessions and seats left); enrollment stays reserve-then-contact (§16 Q5): `POST /courses/:slug/enroll {sessionId, name, phone, email}` creates a `reserved` enrollment without payment.
- `SimResult { id; userId; mission: string; score:int; stars:int(0-3); timeMs:int; crashes:int; createdAt }`; `POST /me/sim-results` (auth), `GET /me/sim-results?mission=` best per mission.

- [ ] **Step 1: Failing tests:** `public settings fall back to defaults`; `admin updates contact and public reflects it`; `quote stores productSlug and students`; `course enroll reserves a seat and decrements seats left`; `enroll in a full session is 409`; `sim result rejects stars outside 0-3`; `best result per mission is returned`.
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** Commit `feat: settings, quotes v2, courses v2 and simulator results`.

### Task 8: v2 seed (placeholder content)

**Files:**
- Create: `backend/src/database/seed-v2.ts`, `backend/src/database/seed-v2.spec.ts`
- Modify: `backend/package.json` (`seed:v2`), `vercel-build` (run `seed-v2` when `RUN_SEED=1`)

**Interfaces:**
- Consumes: all above. Produces idempotent `seedV2(manager)`: upserts by slug the products currently shown on www (from `src/lib/commerce/storefront-catalog.ts` data: names, prices, summaries, Wikimedia images with attribution in `gallery[].alt`), 3 placeholder combos (Tiểu học, STEM lập trình THCS–THPT, Lớp học Quốc tế) whose items reference those products and **no size tiers**, 3 placeholder courses with "Đang cập nhật" descriptions, default settings. Never overwrites inventory `onHand` or prices that already exist (insert-only for those fields).

- [ ] **Step 1: Failing tests:** `seeding twice leaves one row per slug`; `existing prices and stock are not overwritten`; `combos have items and no tiers`.
- [ ] **Step 2–4:** FAIL → implement → PASS. **Step 5:** Commit `feat(seed): v2 placeholder catalog, combos, courses and settings`.
