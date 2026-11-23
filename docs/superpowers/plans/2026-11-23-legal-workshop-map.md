# Workshop, pháp lý và bản đồ khu vực bay: kế hoạch thực hiện

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm trang Workshop (Giáo dục), Chứng chỉ, Cấp phép bay, Quy định pháp lý và Bản đồ khu vực bay (Đào tạo & chứng chỉ), nội dung có nguồn.

**Architecture:** Pháp lý là bài viết `kind: phap-ly` lấy qua API có sẵn, trang chỉ là khung. Workshop là khóa học `level: workshop` dùng lịch và form đặt chỗ có sẵn. Bản đồ là Leaflet nạp động, đọc `public/geo/flight-zones.json` do một script dựng từ OSM và Natural Earth theo QĐ 18/2020.

**Tech Stack:** Next.js 16 (đọc `node_modules/next/dist/docs/` trước khi viết route), NestJS + TypeORM + Postgres, Vitest, Playwright, Leaflet 1.9, @turf/turf (chỉ trong script).

**Spec:** `docs/superpowers/specs/2026-11-23-legal-workshop-map-design.md`

## Global Constraints

- Mọi ý pháp lý ghi nguồn: số văn bản + điều/khoản. Không ghi mức phạt bằng số (NĐ 282/2025 chưa đọc được bản gốc).
- Bài pháp lý không xuất hiện ở R&D, tìm kiếm, tin trang chủ, sitemap `/r-d/*`.
- Bản đồ luôn có: nhãn "Quần đảo Hoàng Sa (Việt Nam)", "Quần đảo Trường Sa (Việt Nam)"; chú thích "Chỉ để tham khảo"; nút tới https://cambay.mod.gov.vn.
- Không lấy dữ liệu từ cambay.mod.gov.vn.
- `leaflet` chỉ được import trong `src/components/flight-map/engine/`.
- Chữ trên site: tiếng Việt, dấu phẩy thập phân, không gạch ngang dài.
- Test tích hợp backend chạy trên `droneviet_test`, không phải DB dev.

## Review Focus

1. Bài `phap-ly` chưa đăng (API trả 404) → trang vẫn hiện khung và "Đang cập nhật", không 500. → Task 5 test `renders the frame when the article is missing`.
2. Chưa có khóa workshop nào hoặc chưa có đợt học → trang workshop hiện giới thiệu mặc định và nút Zalo chung. → Task 3 test `shows the default intro without a workshop course`.
3. Đợt workshop hết chỗ, số người đăng ký lớn hơn số chỗ còn → API từ chối, form báo lỗi tiếng Việt. → Task 2 test `rejects a group larger than the seats left`.
4. Điểm bấm trên biển, ngoài mọi vùng → báo "Không nằm trong vùng đã vẽ", vẫn nhắc kiểm tra bản đồ chính thức (không bao giờ nói "được phép bay"). → Task 6 test `a point outside every zone is "unknown", not "allowed"`.
5. Tìm địa điểm lỗi mạng hoặc không có kết quả → thông báo, bản đồ vẫn dùng được. → Task 7 test `search failure shows a message`.

---

### Task 1: Bài viết loại `phap-ly` tách khỏi danh sách chung

**Files:**
- Modify: `backend/src/content/content.service.ts` (`listPublicArticles`), `backend/src/content/content.controller.ts`, `backend/src/content/entities/article.entity.ts` (comment kind)
- Modify: `src/lib/api/server.ts` (`listArticles`), `scripts/rd/lib.mjs` (cho phép `kind: phap-ly`)
- Test: `backend/src/content/content.integration.spec.ts`, `src/lib/api/server.test.ts`

**Interfaces:**
- Produces: `GET /content/articles?kind=phap-ly`; không có `kind` thì loại `phap-ly`. `listArticles(opts: { tag?; level?; limit?; kind?: string })`. `getArticle(slug)` không đổi (trả cả bài phap-ly).

- [ ] Test `legal articles are listed only when asked for`: đăng 1 bài `guide`, 1 bài `phap-ly`; `GET /content/articles` chỉ có bài guide; `?kind=phap-ly` chỉ có bài phap-ly; `GET /content/articles/<slug phap-ly>` trả 200.
- [ ] Chạy, thấy fail. Sửa `listPublicArticles(filter: { tag?; level?; limit?; kind? })`: `kind` có thì lọc đúng kind, không có thì bỏ `phap-ly`. Controller nhận `@Query("kind")`.
- [ ] Web: test `listArticles({ kind: "phap-ly" })` gọi `/content/articles?kind=phap-ly`. Sửa `listArticles`.
- [ ] `scripts/rd/lib.mjs`: kiểm tra test hiện có của script; `kind` trong front matter đi thẳng vào payload (đã có), chỉ cần thêm test nếu có danh sách kind hợp lệ.
- [ ] `cd backend && npm test -- content` và `npx vitest run src/lib/api` pass. Commit `feat(content): legal article kind kept out of public lists`.

### Task 2: Backend workshop (khóa học `level: workshop`, Zalo, form mở rộng)

**Files:**
- Create: `backend/src/database/migrations/<timestamp>-WorkshopFields.ts`
- Modify: `backend/src/courses/entities/course.entity.ts` (+`zaloGroupUrl: string | null`), `course-enrollment.entity.ts` (+`organization: string | null`, +`note: string | null`), `courses.controller.ts`, `courses.service.ts` (`reserveEnrollment` nhận `quantity`, `organization`, `note`), `admin-courses.controller.ts` (+`PATCH courses/:slug`), `backend/src/database/seed-v2.ts` (khóa `workshop-trai-nghiem-drone`)
- Test: `backend/src/courses/courses.integration.spec.ts`, `backend/src/database/seed-v2.integration.spec.ts`

**Interfaces:**
- Produces: `GET /courses?level=workshop` → card có thêm `zaloGroupUrl`. `GET /courses/:slug` có `zaloGroupUrl`. `POST /courses/:slug/enroll` body `{ sessionId, name, phone, email?, organization?, note?, quantity? (1..200, mặc định 1) }` → `{ id, status, zaloGroupUrl }`. `PATCH /admin/courses/:slug` body `{ summary?, descriptionMarkdown?, zaloGroupUrl? (https URL bắt đầu bằng https://zalo.me/ hoặc null) }`, quyền `instructor`, `super_admin`.

- [ ] Tests: `lists only workshops with ?level=workshop`; `enroll stores organization, note and group size and returns the Zalo link`; `rejects a group larger than the seats left` (409, ghế không đổi); `admin sets the Zalo group link` (customer 403, link không phải zalo.me → 400); seed test `seeds the workshop course`.
- [ ] Chạy, thấy fail. Viết migration (3 cột nullable), entity, DTO (`@IsOptional() @IsInt() @Min(1) @Max(200) quantity`, `@MaxLength(200) organization`, `@MaxLength(1000) note`), service dùng `quantity` khi trừ chỗ, controller lọc `level`, admin PATCH, seed khóa workshop (title "Workshop trải nghiệm drone", `level: "workshop"`, `format: "truc-tiep"`, `descriptionMarkdown` giới thiệu mặc định, theo cách seed các khóa hiện có).
- [ ] `cd backend && npm test` pass. Commit `feat(courses): workshop level, group size and Zalo group link`.

### Task 3: Trang Workshop trong Giáo dục

**Files:**
- Create: `src/app/giao-duc/workshop/page.tsx`, `src/app/giao-duc/workshop/workshop-page.test.tsx`, `src/content/workshop.ts` (giới thiệu mặc định: nội dung buổi, đối tượng, thời lượng, hình thức)
- Modify: `src/components/forms/enroll-form.tsx` (prop `group?: boolean` thêm trường Trường/đơn vị, Số người, Ghi chú; sau khi gửi hiện nút nhóm Zalo nếu có), `src/lib/api/server.ts` (+`listCourses({ level? })`), `src/lib/api/types.ts` (+`zaloGroupUrl`), `src/components/site/nav.ts` (Giáo dục + "Workshop trải nghiệm" `/giao-duc/workshop`), `src/app/giao-duc/page.tsx` (khối workshop), `src/app/admin/khoa-hoc/page.tsx` (ô sửa link Zalo, tóm tắt, mô tả), `src/app/sitemap.ts`

**Interfaces:**
- Consumes: Task 2 API.
- Produces: `EnrollForm({ course, group?: boolean })`; `WORKSHOP_INTRO: { title; lead; points: { title; text }[] }`.

- [ ] Tests: `shows upcoming workshop sessions and the Zalo group link`; `shows the default intro without a workshop course` (API `[]` → giới thiệu mặc định + nút Zalo chung từ settings); `group form sends organization and size` (body có `organization`, `quantity: 12`); `after enrolling shows the Zalo group button`; nav test có mục Workshop; route `/giao-duc/workshop` không bị `[cap]` bắt (render page workshop, không 404).
- [ ] Chạy, thấy fail; làm trang (Container/Section/PageHeader như `/giao-duc`), crumbs Trang chủ › Giáo dục › Workshop, metadata + canonical.
- [ ] `npx vitest run` pass, `npx tsc --noEmit`, `npx eslint src`. Commit `feat(web): workshop page under education`.

### Task 4: Nội dung pháp lý (4 bài Markdown)

**Files:**
- Create: `content/phap-ly/giay-phep-dieu-khien-drone/index.md`, `content/phap-ly/cap-phep-bay-drone/index.md`, `content/phap-ly/quy-dinh-phap-ly-drone/index.md`, `content/phap-ly/khu-vuc-cam-bay-drone/index.md`

Front matter: `kind: phap-ly`, `locale: vi`, `tags: [phap-ly]`, `levels: []`. Cuối mỗi bài: mục "Nguồn" (liệt kê văn bản, điều) và dòng "Cập nhật 23/11/2026. Thông tin tham khảo, không thay thế văn bản pháp luật."

- [ ] Giấy phép: phân loại theo trọng lượng (NĐ 288 Đ4.1); điều kiện người điều khiển (Đ19.2–19.3, 19.6); Hạng A/B (Đ27.1), hiệu lực 10 năm (Đ27.2), đào tạo tại cơ sở giáo dục nghề nghiệp, Bộ Quốc phòng cấp (Đ27.3, 27.9, Đ28), cấp đổi/cấp lại (Đ29); khoản 1, 3 Đ19 hiệu lực 01/7/2026 (Đ34.2); dưới 0,25 kg không cần đủ 18 tuổi.
- [ ] Cấp phép bay: ai cấp (Đ21.2), miễn phép cho dưới 0,25 kg vui chơi ngoài vùng cấm/hạn chế (Đ21.1.b), mỗi hoạt động 1 phép, theo nhiệm vụ/sự kiện/địa điểm (Đ21.1.c–d), thời hạn 30/180/360 ngày (Đ21.4), hồ sơ (Đ22.1, Mẫu số 06), nộp trước 7 ngày, 12 ngày nếu cần NOTAM (Đ22.2.a), trả lời trong 5 ngày làm việc (Đ22.2.b), nộp trực tiếp, bưu chính hoặc Cổng Dịch vụ công quốc gia; mang theo khi bay (Đ25.1.a), hiệp đồng ít nhất 24 giờ (Đ25.2.c); bay trong vùng cấm chỉ cho công vụ (Đ19.7).
- [ ] Quy định pháp lý: danh sách văn bản hiện hành (Luật 49/2024/QH15 + Luật 98/2025/QH15, NĐ 288/2025, QĐ 18/2020/QĐ-TTg, NĐ 282/2025 Điều 8 về xử phạt), văn bản hết hiệu lực (NĐ 36/2008, Điều 1 NĐ 79/2011, Đ34.3), đăng ký phương tiện tại Công an (Đ20), lưu ý cho trường học (drone dưới 0,25 kg trong nhà).
- [ ] Khu vực cấm bay: các loại vùng cấm (QĐ 18/2020 Đ3.1–3.6: 500 m, 200 m, 500 m, sân bay 15 km × 5 km mỗi bên, đường hàng không, vùng tạm thời) và hạn chế (Đ4.1–4.4: trên 120 m, đông người, biên giới 25 km/10 km, tiếp giáp sân bay 3 km × 5 km); bản đồ chính thức cambay.mod.gov.vn từ 15/6/2025.
- [ ] `npm run rd:publish -- content/phap-ly/<slug> --dry-run` cho cả 4 bài, không lỗi. Commit `content: legal guides (licence, flight permit, regulations, no-fly zones)`.

### Task 5: Trang pháp lý và menu Đào tạo

**Files:**
- Create: `src/components/page/legal-article.tsx`, `src/app/dao-tao/cap-phep/page.tsx`, `src/app/dao-tao/quy-dinh/page.tsx`, `src/app/dao-tao/legal-pages.test.tsx`, `src/content/legal.ts` (slug, tiêu đề, tóm tắt nhanh từng trang, liên kết chéo)
- Modify: `src/app/dao-tao/chung-chi/page.tsx`, `src/app/dao-tao/page.tsx` (lưới 4 trang), `src/app/bay-an-toan/page.tsx` (thay `LEGAL_TOPICS` bằng liên kết), `src/content/safety.ts`, `src/components/site/nav.ts` (Đào tạo có `children`), `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `getArticle(slug)` (Task 1), bài Task 4.
- Produces: `LegalArticle({ slug, fallback }: { slug: string; fallback: ReactNode })` server component: render Markdown như trang R&D (dùng lại renderer của `/r-d/[slug]`), không có bài thì render `fallback`. `LEGAL_PAGES: { href; title; lead; articleSlug }[]`.

- [ ] Tests: `licence page renders the article body`; `renders the frame when the article is missing` (getArticle → null: có tiêu đề, "Đang cập nhật", nút liên hệ); `training menu lists the five pages`; `safety page links to the legal pages`.
- [ ] Chạy, thấy fail; làm. `/dao-tao/chung-chi` giữ 4 bước lộ trình phía trên, thân bài từ `giay-phep-dieu-khien-drone`. Mỗi trang có metadata + canonical và liên kết chéo tới 3 trang còn lại + bản đồ.
- [ ] `npx vitest run`, `tsc`, `eslint` pass. Commit `feat(web): licence, permit and regulation pages under training`.

### Task 6: Dữ liệu vùng bay

**Files:**
- Create: `scripts/flight-zones/geometry.mjs`, `scripts/flight-zones/geometry.test.mjs` (chạy bằng vitest, thêm vào `include` nếu cần), `scripts/flight-zones/build.mjs`, `public/geo/flight-zones.json`, `src/components/flight-map/zones.ts`, `src/components/flight-map/zones.test.ts`
- Modify: `package.json` (devDependency `@turf/turf`, script `zones:build`)

**Interfaces:**
- Produces: `public/geo/flight-zones.json`: GeoJSON FeatureCollection, mỗi feature `properties: { kind: "cam" | "han-che", category: "san-bay" | "san-bay-tiep-giap" | "bien-gioi", name: string, rule: string /* vd "QĐ 18/2020/QĐ-TTg, Điều 3 khoản 4" */ }`, top-level `metadata: { builtAt, sources: string[] }`.
- `airportRectangles(runways: { name; ends: [[lon, lat], [lon, lat]] }[]): { cam: Polygon; hanChe: Polygon }` trong `geometry.mjs`: một đường băng → chữ nhật dọc trục, kéo 15 km khỏi mỗi đầu, ±5 km; hạn chế: +5 km dọc, +3 km ngang. Nhiều đường băng cùng sân bay → bao quanh (hull) các chữ nhật.
- `zoneAt(point: [lon, lat], zones: FeatureCollection): { status: "cam" | "han-che" | "unknown"; zones: Feature[] }` trong `zones.ts`; cấm ưu tiên hơn hạn chế.

- [ ] Tests geometry: `a 3 km runway gives a 33 km × 10 km no-fly rectangle` (diện tích ≈ 330 km² ±2%); `restricted ring extends 5 km along and 3 km across`; `parallel runways are wrapped together`.
- [ ] Tests zones: `a point beside Nội Bài is in the no-fly zone`; `a point outside every zone is "unknown", not "allowed"`; `no-fly wins over restricted`.
- [ ] Viết `build.mjs`: Overpass (`aeroway=runway` trong `area["ISO3166-1"="VN"]`, bỏ `disused`/`abandoned`, dài dưới 1.000 m), gom theo sân bay (`aeroway=aerodrome` chứa đường băng), Natural Earth 10m `admin_0_boundary_lines_land` + `admin_0_countries` lấy biên VN–Trung Quốc/Lào/Campuchia, buffer 25/10 km, giao với lãnh thổ VN; đơn giản hóa để file dưới 300 KB. User-Agent chung, không gửi thông tin cá nhân.
- [ ] `npm run zones:build`; kiểm tra số sân bay (≥ 20) và 3 dải biên giới; commit dữ liệu. Commit `feat(map): flight zone data from QĐ 18/2020 rules`.

### Task 7: Trang bản đồ khu vực bay

**Files:**
- Create: `src/app/dao-tao/ban-do/page.tsx`, `src/components/flight-map/map-launcher.tsx` (client, `import()` engine), `src/components/flight-map/engine/flight-map.tsx`, `src/components/flight-map/no-leaflet-elsewhere.test.ts`, `src/app/dao-tao/ban-do/map-page.test.tsx`
- Modify: `package.json` (`leaflet@1.9.4`, `@types/leaflet`), `e2e/journeys.spec.ts`

**Interfaces:**
- Consumes: `zoneAt`, `public/geo/flight-zones.json`, bài `khu-vuc-cam-bay-drone` qua `LegalArticle`.

- [ ] Tests: `no module outside the map engine imports leaflet`; page `shows the legend, the reference note and the official map link`; engine `search failure shows a message` (fetch Nominatim reject → "Không tìm được địa điểm"); `clicking a point reports its zone` (mock zoneAt).
- [ ] Làm: nền OSM (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, ghi công OSM), khung nhìn Việt Nam, lớp vùng (cấm đỏ, hạn chế cam), 2 nhãn chủ quyền tại (112,0°E; 16,5°N) và (114,0°E; 10,0°N), tìm kiếm Nominatim (`countrycodes=vn`, gõ xong mới gọi, tối đa 1 lần/giây), nút "Vị trí của tôi", bảng kết quả khi bấm điểm, chú thích các vùng không vẽ được (QĐ 18/2020 Đ3.1–3.3, Đ4.1–4.2). Dưới bản đồ: bài `khu-vuc-cam-bay-drone`.
- [ ] e2e: `flight map loads leaflet only on the map page and shows the sovereignty labels`.
- [ ] `npx vitest run`, `tsc`, `eslint`, `npx playwright test -g "flight map"` pass. Commit `feat(web): flight zone map`.

### Task 8: Kiểm tra toàn bộ

- [ ] Backend `npm test`, web `npx vitest run`, `npx playwright test`, `npx next build` đều pass.
- [ ] Chụp màn hình desktop và 390 px cho 5 trang; axe không có lỗi serious/critical.
- [ ] Cập nhật `docs/superpowers/plans/2026-11-23-v2-roadmap.md` (mục Status) và danh sách việc cho chủ dự án: đối chiếu QĐ 18/2020 bản Công báo, mức phạt NĐ 282/2025, đăng 4 bài (`npm run rd:publish -- content/phap-ly/<slug> --publish`), tạo đợt workshop và link Zalo trong admin. Commit `docs: roadmap status after legal, workshop and map`.
