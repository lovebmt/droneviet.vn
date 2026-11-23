# v2 Plan 2 — Web Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The shared base every v2 page builds on: design tokens, Be Vietnam Pro, UI primitives, typed API client with tag caching, revalidation endpoint, session + cart, site chrome (announcement, header with mega menu, mobile menu, footer) and the old-URL redirects.

**Architecture:** Next.js 16 App Router, previous caching model (`fetch` with `next: { revalidate, tags }`, `revalidateTag(tag, "max")`). Public pages stay cacheable; session and cart live in client providers (`/auth/me` with `credentials: "include"`, cart in `localStorage`).

**Tech Stack:** Next.js 16.2, React 19, Tailwind v4 (`@theme`), `next/font/google` (Be Vietnam Pro), `lucide-react`, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-23-droneviet-v2-rewrite-design.md` (§6, §7, §8, §9.2, §9.4); backend contracts from Plan 1.

## Global Constraints

- Branch `rewrite/v2`, no production deploy. Read `node_modules/next/dist/docs/` for any Next API used.
- Colors exactly (§7.1): sky `#0B6FE0`, teal `#13B8A6` (never white text on it), teal-ink `#08857A`, sun `#FFC531` (only simulator/badges), sky-50 `#EAF4FF`, ink `#0F2742`, muted `#4A6078`, line `#D7E3EF`, paper `#FFFFFF`.
- Be Vietnam Pro 300/400/600/700, subsets `vietnamese`,`latin`; one family. Lucide icons, stroke 1.75.
- Copy rules (§7.4): no all-caps eyebrows, no "A · B · C" strings, no "›/→" characters (use `ChevronRight`), sentence case, buttons name their action.
- Radius: tiles 16px, images 12px, buttons/badges pill. No blanket shadows. Respect `prefers-reduced-motion`.
- API base: `NEXT_PUBLIC_COMMERCE_API_URL`. Always pass `?kind=` to `/catalog/products`. 401 = sign in, 403 = not allowed.
- Web tests: `npx vitest run --exclude ".claude/**" --exclude "backend/**" --exclude "node_modules/**"`; plus `npm run lint` (0 errors) and `npm run build`.
- Commits authored by lovebmt, attribution `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. API unreachable while rendering a cached page → page still renders with an empty state, never a 500. → Task 2
2. `/api/revalidate` called without or with a wrong secret → 401, no cache purged. → Task 2
3. `localStorage` unavailable or corrupt (private mode, bad JSON) → cart starts empty, no crash. → Task 3
4. Header on a 360px screen → nav collapses into the menu button; nothing overflows horizontally. → Task 4
5. Old URLs (`/san-pham/x`, `/tin-tuc/y`, `/giai-phap`) → permanent redirect to the v2 URL, keeping the slug. → Task 5

---

### Task 1: Design tokens, font, UI primitives

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`. Create `src/components/ui/{button.tsx,badge.tsx,container.tsx,section.tsx,price.tsx}`, `src/lib/format.ts`; tests beside them.

**Interfaces — Produces:**
- Tailwind theme colors `sky, teal, teal-ink, sun, sky-50, ink, muted, line` (e.g. `bg-sky`, `text-ink`); font var `--font-sans` = Be Vietnam Pro.
- `formatVnd(amount: number): string` → `"9.500.000 ₫"`; `formatDate(iso: string): string` → `"23/11/2026"`.
- `<Button variant="primary|secondary|ghost|sun" size="md|lg" …buttonProps>`; `<LinkButton href variant size>` (Next `Link`); `<Badge tone="teal|sun|sky|neutral">`; `<Container>` (max-w-7xl, px-5 sm:px-8); `<Section tone="paper|sky">`; `<Price amountVnd={number|null} />` renders `formatVnd` or "Liên hệ báo giá" when null.

- [ ] Step 1: failing tests: `formatVnd groups thousands with dots and appends ₫`; `Price shows "Liên hệ báo giá" for null`; `LinkButton renders a link with its href and variant classes`; `Badge sun tone uses ink text`.
- [ ] Step 2: run → FAIL. Step 3: implement. Step 4: tests + lint + build → PASS. Step 5: commit `feat(web): v2 design tokens, Be Vietnam Pro and UI primitives`.

### Task 2: Typed API client, cached fetch, revalidate endpoint

**Files:** Create `src/lib/api/{types.ts,server.ts,client.ts}`, `src/app/api/revalidate/route.ts`; tests.

**Interfaces — Produces:**
- `types.ts`: `ProductCard`, `ProductDetail`, `ArticleSummary`, `Article`, `CourseCard`, `CourseDetail`, `PublicSettings`, `SessionUser`, `MyOrder` mirroring Plan 1 responses.
- `server.ts` (server-only): `apiGet<T>(path: string, opts: { tags: string[]; revalidate?: number; fallback: T }): Promise<T>` — `fetch(base+path, { next: { tags, revalidate: opts.revalidate ?? 300 } })`; non-2xx or network error → returns `fallback` and logs (Review Focus 1); 404 handled by callers via `apiGetOrNull<T>(path, {tags})` returning `null`.
  Helpers: `listProducts(kind, opts?)`, `getProduct(slug)`, `listArticles(opts?)`, `getArticle(slug)`, `listCourses()`, `getCourse(slug)`, `getSettings()` with tags `catalog`, `product:<slug>`, `articles`, `article:<slug>`, `courses`, `settings`.
- `client.ts`: `apiFetch<T>(path, init?)` with `credentials: "include"`, JSON, throws `ApiError {status, message}`.
- `POST /api/revalidate` body `{tags: string[]}` header `x-revalidate-secret` = `WEB_REVALIDATE_SECRET` → calls `revalidateTag(tag, "max")` for each, returns `{revalidated: tags}`; missing/wrong secret or unset env → 401 (Review Focus 2).

- [ ] Step 1: failing tests: `apiGet returns fallback when the API is down`; `apiGet passes tags and revalidate to fetch`; `apiGetOrNull returns null on 404`; `revalidate route rejects a wrong secret with 401`; `revalidate route revalidates each tag`.
- [ ] Steps 2–4: FAIL → implement → PASS. Step 5: commit `feat(web): typed API client with tag caching and revalidate endpoint`.

### Task 3: Session and cart providers

**Files:** Create `src/components/providers/{session-provider.tsx,cart-provider.tsx,app-providers.tsx}`; tests. Modify `src/lib/commerce/customer-auth.ts` (use `apiFetch`, add `logout()`).

**Interfaces — Produces:**
- `useSession(): { user: SessionUser | null; status: "loading"|"signed-in"|"signed-out"; refresh(): Promise<void>; logout(): Promise<void> }` (GET `/auth/me`, 401 → signed-out).
- `useCart(): { lines: CartLine[]; count: number; totalVnd: number; add(line: CartLine): void; setQuantity(variantId, qty): void; remove(variantId): void; clear(): void }`; `CartLine = { variantId; slug; name; priceVnd; quantity; imageUrl: string|null }`; persisted under `localStorage["dv-cart-v2"]`; invalid/unavailable storage → empty cart (Review Focus 3).
- `<AppProviders>` wraps both; used in root layout.

- [ ] Step 1: failing tests: `cart persists lines and restores them on reload`; `adding the same variant increases quantity`; `corrupt or blocked localStorage yields an empty cart`; `session is signed-out on 401 and signed-in with the user on 200`; `logout clears the user`.
- [ ] Steps 2–4. Step 5: commit `feat(web): session and persistent cart providers`.

### Task 4: Site chrome

**Files:** Create `src/components/site/{announcement-bar.tsx,site-header.tsx,mega-menu.tsx,mobile-menu.tsx,site-footer.tsx,nav.ts}`; tests. Modify `src/app/layout.tsx` (providers + chrome; settings via `getSettings()`).

**Interfaces — Produces:**
- `nav.ts`: `mainNav` = Giáo dục `/giao-duc` (mega: Tiểu học, THCS, THPT & quốc tế, Đại học & R&D → `/giao-duc/<cap>`), Cửa hàng `/cua-hang` (mega: Combo lớp học `/cua-hang?loai=combo`, Drone `?loai=drone`, Linh kiện & phụ kiện `?loai=linh-kien`, So sánh combo `/cua-hang/so-sanh`), Đào tạo & chứng chỉ `/dao-tao`, R&D `/r-d`, Bay mô phỏng `/bay-mo-phong` (sun pill), Hỗ trợ `/ho-tro`.
- Header: logo "Drone Việt" → `/`; icons Search (`/tim-kiem`), UserRound (`/tai-khoan` or `/dang-nhap` when signed out), ShoppingBag (`/gio-hang`, count badge from cart); `LinkButton` "Nhận tư vấn" → `/bao-gia`. Sticky white, bottom border `line`. Below `lg`: menu button opens full-screen mobile menu (Escape closes, focus trapped, body scroll locked).
- Announcement bar: shows `settings.announcement` when present; dismissible (state in `sessionStorage`, try/catch).
- Footer (ink): columns Giáo dục, Cửa hàng, Đào tạo, Hỗ trợ; contact from settings (Zalo link `https://zalo.me/<zalo>`, phone/email/address only when set, else "Đang cập nhật"); legal links `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`; trio row "Liên hệ & báo giá · Hỗ trợ & bảo hành · Bay an toàn & cấp phép" rendered as three linked cells (no middle-dot string).

- [ ] Step 1: failing tests: `header links every main section with the simulator highlighted`; `cart icon shows the item count`; `account icon points to sign-in when signed out`; `mobile menu opens, lists sections and closes on Escape` (Review Focus 4 asserted via `lg:hidden`/`hidden lg:flex` classes); `footer shows Zalo contact and "Đang cập nhật" for missing fields`; `footer links legal pages`.
- [ ] Steps 2–4 (plus screenshot at 360px and 1440px for visual check). Step 5: commit `feat(web): v2 header, mega menu, mobile menu, footer and announcement`.

### Task 5: Redirects from old URLs

**Files:** Modify `next.config.ts`, `src/app/apex-redirects.test.ts` (add cases).

**Interfaces — Produces:** permanent redirects: `/san-pham/:slug` → `/cua-hang/:slug`; `/san-pham` → `/cua-hang`; `/cua-hang/danh-muc/:topic` → `/cua-hang`; `/giai-phap`, `/dich-vu`, `/giao-trinh` → `/giao-duc`; `/khoa-hoc` → `/dao-tao`; `/khoa-hoc/:slug` → `/dao-tao/:slug`; `/tin-tuc` → `/r-d`; `/tin-tuc/:slug` → `/r-d/:slug`; `/theo-doi-don` → `/tai-khoan/don-hang`; `/en/:path*` → `/en` stays (EN pages in Plan 3; until then `/en/:path+` → `/en`). Apex rule unchanged.

- [ ] Step 1: failing test `old URLs redirect permanently to v2 URLs keeping the slug` (Review Focus 5).
- [ ] Steps 2–4. Step 5: commit `feat(web): redirect old URLs to v2`.
