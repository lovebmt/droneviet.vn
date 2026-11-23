# v2 Plan 3 — Public Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every public page of v2 (spec §6, §8): home, Giáo dục, Cửa hàng (list, product, combo + quote estimator, so sánh), báo giá, giỏ hàng + thanh toán, Đào tạo (+ chứng chỉ, enroll), R&D (Markdown with directives), Tài khoản, Hỗ trợ, Bay an toàn, tìm kiếm, EN pages, SEO, 404 — on the Plan 2 foundation.

**Architecture:** Server Components read the API through `src/lib/api/server.ts` (tag-cached); interactive parts (cart buttons, estimator, forms, account) are small client components using `apiFetch`/`useCart`/`useSession`. Editorial copy that is not in the database (education levels, support FAQ, flight safety) lives in typed modules under `src/content/` — new v2 copy, placeholders marked "Đang cập nhật" where facts are unknown (spec §16).

**Tech Stack:** Next.js 16 App Router, Tailwind v4 tokens, lucide-react, react-markdown + remark-gfm + remark-directive, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-23-droneviet-v2-rewrite-design.md`; foundation `docs/superpowers/plans/2026-11-23-v2-plan-2-web-foundation.md`.

## Global Constraints

- All of Plan 2's Global Constraints (tokens, copy rules, `?kind=` always, 401/403, test command, commits).
- DJI-style layout patterns only (§7.5): full-bleed hero, 2-column large tiles on `sky-50`, generous whitespace; never DJI assets or copy.
- Never invent prices, stats, partners or legal facts: null price → "Liên hệ báo giá"; unknown facts → "Đang cập nhật".
- Combos are never added to the cart; they link to quote (spec §5.3). Checkout-mode products use "Thêm vào giỏ"; preorder "Đặt trước" (quote form with product prefilled); quote_only "Nhận báo giá".
- YouTube embeds only via `https://www.youtube-nocookie.com/embed/<11-char id>`; anything else in a directive renders nothing.
- Every page exports `metadata`/`generateMetadata` (title, description, canonical on www); product pages add JSON-LD `Product`.
- Responsive 320px+, no horizontal overflow; images through `next/image` with explicit `sizes`.

## Review Focus

1. Product or article slug that does not exist → `notFound()` (404 page), not a crash. → Tasks 3, 6
2. Combo with no size tiers → estimator hidden, price "Liên hệ báo giá", quote form still works. → Task 3
3. Out-of-stock checkout product → "Hết hàng" disabled button, cannot be added to the cart. → Task 3
4. Markdown with a `::youtube` directive whose id is not a valid YouTube id, or raw HTML/script → nothing executable rendered. → Task 6
5. Checkout with an empty cart, or the API rejecting a line (sold out) → clear Vietnamese message, cart kept. → Task 4

---

### Task 1: Shared page components and Markdown renderer
**Files:** `src/components/catalog/{product-tile.tsx,product-card.tsx,add-to-cart.tsx,purchase-button.tsx}`, `src/components/page/{page-header.tsx,breadcrumbs.tsx,hero-carousel.tsx,empty-state.tsx}`, `src/components/content/markdown.tsx`; tests. Install `remark-directive`.
**Produces:** `<ProductTile product eyebrow? />` (DJI tile: small context line, large light name, summary, links "Tìm hiểu"/action); `<ProductCard product />`; `<PurchaseButton product variantId? />` maps purchaseMode/inStock to Thêm vào giỏ / Hết hàng (disabled) / Đặt trước / Nhận báo giá; combos → link `/bao-gia?san-pham=<slug>`; `<AddToCart line />` client; `<HeroCarousel slides={[{title, subtitle, context, image?, actions:[{label,href,variant}]}]} />` (auto-advance 7s, pauses on hover/focus, disabled with reduced motion, dots + prev/next buttons labelled); `<Markdown source relatedProducts? />` (GFM + directives: `youtube{id}`, `product{slug}`, `:::note`, `:::warning`, `file{url,label}`; skipHtml).
- [ ] Tests: `PurchaseButton shows Hết hàng disabled for an out-of-stock checkout product`; `PurchaseButton sends combos to the quote form`; `Markdown embeds a valid YouTube id with youtube-nocookie`; `Markdown drops an invalid YouTube id and raw HTML`; `Markdown renders note and product directives`; `HeroCarousel moves to the next slide with the next button`. FAIL → implement → PASS → commit `feat(web): shared catalog, page and Markdown components`.

### Task 2: Home page
**Files:** `src/app/page.tsx`, `src/content/home.ts`; test `src/app/home.test.tsx`.
**Consumes:** `listProducts("combo")`, `listProducts("drone",{featured:true})`, `listArticles({limit:2})`.
**Produces:** sections in order (§8.1): HeroCarousel (Combo Lớp học Quốc tế → `/cua-hang/combo/combo-lop-hoc-quoc-te` + `/bao-gia?san-pham=combo-lop-hoc-quoc-te`; Bay mô phỏng → `/bay-mo-phong`; first featured drone → product + cart action); 2-column tiles (combos, first featured drone, "Linh kiện & phụ kiện" → `/cua-hang?loai=linh-kien`, "Lộ trình chứng chỉ" → `/dao-tao/chung-chi`, "So sánh các combo" → `/cua-hang/so-sanh`); simulator band (ink bg, sun button "Bay thử"); latest 2 R&D articles (hidden when none); 4 level tiles → `/giao-duc/<cap>`; deployment process (4 real steps, numbered because it is a sequence).
- [ ] Tests: `home shows the combo hero with quote action`; `home tiles link combos, parts, certificate path and comparison`; `home hides the R&D section when there are no articles`; `home renders with the API down` (all fallbacks empty). Commit `feat(web): v2 home page`.

### Task 3: Store — list, product, combo, compare
**Files:** `src/app/cua-hang/page.tsx`, `src/app/cua-hang/[slug]/page.tsx`, `src/app/cua-hang/combo/[slug]/page.tsx`, `src/app/cua-hang/so-sanh/page.tsx`, `src/components/catalog/{combo-estimator.tsx,gallery.tsx,spec-table.tsx}`; tests.
**Produces:** list with tabs `?loai=combo|drone|linh-kien` (linh-kien = kinds `part` + `accessory`), default shows the three sections; product page (gallery, name, badge, price/compare-at, stock, variant select, PurchaseButton, in-the-box, specs, FAQ, compatible, sticky section nav, JSON-LD Product; combos at this URL redirect to `/cua-hang/combo/<slug>`); combo page (§8.3: gallery, levels, price "từ …"/"Liên hệ báo giá", "Nhận tư vấn & báo giá" → `/bao-gia?san-pham=<slug>&hoc-sinh=<n>`, Zalo link, brochure when set, items with quantities linking products, estimator over size tiers (hidden when none), FAQ); compare table across combos (levels, items, tiers/price).
- [ ] Tests: `store list filters by loai and always passes kind`; `unknown product slug calls notFound`; `combo without tiers hides the estimator and shows Liên hệ báo giá`; `estimator updates the estimate and quote link when the class size changes`; `product page JSON-LD contains name and price`; `compare table lists every combo`. Commit `feat(web): store list, product, combo and compare pages`.

### Task 4: Quote, cart, checkout
**Files:** `src/app/bao-gia/page.tsx`, `src/components/forms/quote-form.tsx`, `src/app/gio-hang/page.tsx`, `src/app/thanh-toan/page.tsx`, `src/components/checkout/checkout-form.tsx`; restyle `src/app/thanh-toan/ket-qua/page.tsx`; tests.
**Produces:** quote form (organization, organizationType, contactName, phone, email, students, productSlug from `?san-pham`, requirements) POST `/quotes` → success state "Đã gửi yêu cầu báo giá"; cart page (lines, quantity steppers, remove, total, empty state); checkout (contact, address, payment PayOS/COD/chuyển khoản) POST `/orders` with cookie; PayOS → redirect to `checkoutUrl`; others → success with order number and link to `/tai-khoan/don-hang`; API error → message, cart kept (Review Focus 5).
- [ ] Tests: `quote form prefills the product and students from the URL and posts them`; `cart page updates quantity and total`; `checkout with an empty cart shows a message instead of the form`; `checkout keeps the cart and shows the API error`; `PayOS checkout redirects to the payment URL`. Commit `feat(web): quote form, cart and checkout`.

### Task 5: Education, training, support, safety
**Files:** `src/content/{education.ts,support.ts,safety.ts}`, `src/app/giao-duc/page.tsx`, `src/app/giao-duc/[cap]/page.tsx`, `src/app/dao-tao/page.tsx`, `src/app/dao-tao/[slug]/page.tsx`, `src/app/dao-tao/chung-chi/page.tsx`, `src/components/forms/enroll-form.tsx`, `src/app/ho-tro/page.tsx`, `src/app/bay-an-toan/page.tsx`; tests.
**Produces:** Giáo dục hub (merged Giải pháp + Dịch vụ: offer, 4 levels, international programme, 4-step deployment, school FAQ, quote CTA); level pages (`tieu-hoc|thcs|thpt|dai-hoc`, else 404) with goals, combos for that level (`listProducts("combo",{level})`), CTA; training list + detail (sessions with seats left, enroll form POST `/courses/:slug/enroll`, full → message) + certificate path (steps marked "Đang cập nhật"); support (FAQ, contact from settings, order lookup link); flight safety (general guidance + "Đang cập nhật" for legal specifics).
- [ ] Tests: `education hub links the four levels and the quote form`; `unknown level is 404`; `level page lists combos for that level`; `course page lists sessions with seats left`; `enroll form reports a full session`; `support page shows contact from settings`. Commit `feat(web): education, training, support and safety pages`.

### Task 6: R&D
**Files:** `src/app/r-d/page.tsx`, `src/app/r-d/[slug]/page.tsx`; tests.
**Produces:** list (newest first, filter chips by tag from `?tag`), article (cover, title, date, reading time, Markdown with TOC from headings, attachments, related products, JSON-LD Article, canonical), 404 when missing.
- [ ] Tests: `article page renders Markdown and related products`; `missing article calls notFound`; `list filters by tag`. Commit `feat(web): R&D list and article pages`.

### Task 7: Account and sign-in pages
**Files:** `src/app/tai-khoan/{page.tsx,layout.tsx}`, `src/app/tai-khoan/don-hang/page.tsx`, `src/app/tai-khoan/don-hang/[orderNumber]/page.tsx`, `src/app/tai-khoan/khoa-hoc/page.tsx`, `src/components/account/*`; restyle `src/components/customer/customer-gate.tsx`, `src/app/dang-nhap/callback/oauth-callback.tsx`, `src/components/legal/legal-page.tsx` to tokens; tests.
**Produces:** account (client) redirects to `/dang-nhap?tiep=/tai-khoan` when signed out; profile + logout; my orders list/detail (`/me/orders`), guest lookup form (order number + phone → `/orders/:n?phone=`); my courses; after sign-in, `?tiep=` returns the user (only same-site paths).
- [ ] Tests: `account sends signed-out visitors to sign in`; `my orders lists orders from /me/orders`; `guest lookup shows an order found by number and phone`; `sign-in returns to the tiep path but ignores external URLs`. Commit `feat(web): account pages and restyled sign-in`.

### Task 8: Search, English pages, SEO, 404
**Files:** `src/app/tim-kiem/page.tsx`, `src/app/en/{page.tsx,giao-duc/page.tsx}`, `src/app/en/combo/[slug]/page.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/not-found.tsx`; tests.
**Produces:** search over product cards (all kinds) + articles by `?q` (case/diacritic-insensitive); EN home, EN education, EN combo (nameEn/summaryEn fallback to Vietnamese); robots (allow all, sitemap URL on www); sitemap from API (products, combos, articles, courses, static pages); branded 404 with links.
- [ ] Tests: `search matches without diacritics`; `sitemap lists products, combos and articles from the API`; `EN combo page uses English name with Vietnamese fallback`; `not-found offers links home and to the store`. Commit `feat(web): search, English pages, sitemap and 404`.
