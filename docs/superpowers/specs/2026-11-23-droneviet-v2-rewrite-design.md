# droneviet.vn v2 — thiết kế viết lại toàn bộ

Ngày: 2026-11-23 · Trạng thái: bản nháp chờ chủ dự án duyệt · Branch: `rewrite/v2`

## 1. Mục đích và lý do

Drone Việt bán **giải pháp drone trọn bộ cho giáo dục**, sản phẩm chủ lực là **combo cho một lớp học
(đặc biệt lớp quốc tế)**, người mua chính là nhà trường. Web hiện tại chưa phục vụ việc đó: trang chủ chỉ
có banner, sản phẩm hiển thị từ danh sách viết cứng khác với database, đăng nhập không được giữ, giao
diện không thống nhất. v2 viết lại toàn bộ để web mượt, dễ dùng, đẹp và đủ tính năng của một website drone
giáo dục, giữ lại mọi phần đang chạy tốt.

**Thành công nghĩa là:** một giáo viên/ban giám hiệu vào trang chủ, hiểu ngay Drone Việt bán gì cho lớp
học, xem chi tiết combo và gửi yêu cầu báo giá trong vài phút; khách lẻ mua được drone và linh kiện, theo
dõi được đơn; học viên tìm được khóa học và lộ trình chứng chỉ; ai cũng bay thử được trên trình duyệt.

## 2. Mục tiêu, không làm, không được xảy ra

**Mục tiêu**
- Trang **Giáo dục** là trọng tâm; gộp "Giải pháp" và "Dịch vụ" cũ vào đây.
- **Cửa hàng**: Combo lớp học → Drone → Linh kiện & phụ kiện; trang chi tiết đầy đủ cho từng sản phẩm.
- **Combo chỉ giới thiệu + báo giá** (không bán online); **drone lẻ và linh kiện lẻ bán online** qua PayOS.
- **Đào tạo & chứng chỉ**: khóa học, lịch, lộ trình lấy chứng chỉ, đăng ký.
- **R&D**: bài viết do AI (Claude Code + skill trong repo) soạn, **đăng qua API**, không deploy lại;
  bài có ảnh, video YouTube nhúng, bảng, khung lưu ý, thẻ sản phẩm, tệp đính kèm.
- **Bay mô phỏng (tập lái)** chạy trên trình duyệt, tải riêng.
- **Tài khoản**: giữ phiên đăng nhập, đơn hàng của tôi, khóa học đã đăng ký; giỏ hàng không mất khi tải lại.
- Một nguồn dữ liệu sản phẩm duy nhất (database), admin sửa là web đổi theo.

**Không làm trong v2**
- Lập trình bay (kéo thả/Python) trên trình mô phỏng — làm sau trên cùng engine.
- Trình soạn thảo bài viết trong admin (đăng bài qua API + skill).
- Ứng dụng di động.

**Không được xảy ra (dù chức năng chạy)**
- Mất tài khoản, đơn hàng, cấu hình thanh toán/đăng nhập đang chạy trên production.
- Trang nào cũng tải nặng vì engine 3D của trình mô phỏng.
- Chép logo, ảnh, chữ, tên sản phẩm của DJI; khách nhầm Drone Việt với DJI.
- Link cũ đã được Google lập chỉ mục trả về 404.
- Deploy production nhiều lần trong lúc làm.

## 3. Ràng buộc

- **Next.js 16** (có thay đổi phá vỡ so với bản quen thuộc): đọc `node_modules/next/dist/docs/` trước khi viết code (AGENTS.md).
- Hạ tầng giữ nguyên: Vercel Hobby (cron 1 lần/ngày), API NestJS `api.droneviet.vn`, Neon Postgres (0.5GB free),
  Cloudflare DNS, relay Zalo trên server103, Cloudflare R2 (10GB free, đã bật).
- Giới hạn body request của Vercel ~4.5MB → ảnh tải lên được nén phía client/skill trước.
- Chỉ **một lần deploy production** khi xong toàn bộ. Làm trên branch `rewrite/v2`; preview deploy của Vercel
  được dùng để xem duyệt (không phải production).
- Migration database phải **chỉ thêm** (additive), chạy được trên dữ liệu production hiện có.
- Tiếng Việt là ngôn ngữ chính; mọi font, chữ phải đúng dấu tiếng Việt.

## 4. Các hướng đã cân nhắc

| Hướng | Đánh đổi | Quyết định |
|---|---|---|
| Làm lại từng phần, deploy từng đợt | Web luôn chạy, thấy kết quả sớm; nhưng nhiều lần deploy | Không chọn |
| **Viết lại toàn bộ trên branch, giữ phần chạy tốt, deploy một lần** | Code sạch, đúng ý chủ dự án; rủi ro dồn vào một lần chuyển → cần checklist chuyển đổi và rollback | **Chủ dự án chọn** |
| Dùng CMS có sẵn (Strapi/Payload) | Có sẵn admin; thêm dịch vụ, trùng với API đăng bài | Không chọn |

## 5. Quyết định của chủ dự án

1. Viết lại hết, giữ những gì giữ được, deploy production **một lần**.
2. Gộp "Giải pháp", "Dịch vụ" vào trang Giáo dục.
3. Combo: chỉ giới thiệu chi tiết + nhận tư vấn/báo giá; bán online drone lẻ, linh kiện lẻ.
4. R&D: bài do AI viết qua skill trong repo, đăng qua API (không deploy); có ảnh, YouTube…
5. Ảnh/tệp lưu **Cloudflare R2**, phục vụ qua `api.droneviet.vn/media/…`.
6. Bay mô phỏng: **tập lái** (hướng A), trang tải riêng.
7. Giao diện: **sáng, thân thiện trường học**, theo **bố cục kiểu dji.com** (banner toàn màn hình, lưới ô sản phẩm lớn, nhiều khoảng trắng).
8. Icon **Lucide** (đã có), font **Be Vietnam Pro**, bảng màu tươi (mục 7.1).

## 6. Cấu trúc website và đường dẫn

| Trang mới | Nội dung | Thay cho (redirect 308) |
|---|---|---|
| `/` | Trang chủ (mục 8.1) | — |
| `/giao-duc` | Trọng tâm: giải pháp theo cấp học, chương trình quốc tế, giáo trình, quy trình triển khai, đối tác | `/giai-phap`, `/dich-vu`, `/giao-trinh`, `/[pillar]/[topic]` → mục tương ứng |
| `/giao-duc/[cap-hoc]` | Tiểu học · THCS · THPT & quốc tế · Đại học & R&D | — |
| `/cua-hang` | Combo lớp học / Drone / Linh kiện & phụ kiện; lọc, tìm | `/cua-hang/danh-muc/[topic]` → bộ lọc |
| `/cua-hang/combo/[slug]` | Chi tiết combo + báo giá (mục 8.3) | — |
| `/cua-hang/[slug]` | Chi tiết drone/linh kiện + thêm vào giỏ | `/san-pham/[slug]` |
| `/cua-hang/so-sanh` | So sánh combo | — |
| `/dao-tao` | Khóa học, lịch, lộ trình chứng chỉ | `/khoa-hoc` |
| `/dao-tao/[slug]` | Chi tiết khóa học + đăng ký | `/khoa-hoc/[slug]` |
| `/dao-tao/chung-chi` | Hướng dẫn lấy chứng chỉ (lộ trình từng bước) | — |
| `/r-d`, `/r-d/[slug]` | Danh sách, chi tiết bài (dữ liệu từ API) | `/tin-tuc`, `/tin-tuc/[slug]` (giữ slug) |
| `/bay-mo-phong` | Trình mô phỏng tập lái (tải riêng) | — |
| `/bao-gia` | Form báo giá chung (đã có, làm lại) | — |
| `/gio-hang`, `/thanh-toan`, `/thanh-toan/ket-qua`, `/theo-doi-don` | Mua hàng (giữ luồng PayOS đang chạy) | — |
| `/tai-khoan`, `/tai-khoan/don-hang`, `/tai-khoan/khoa-hoc` | Tài khoản | — |
| `/dang-nhap`, `/dang-ky`, `/dang-nhap/callback`, `/auth/zalo/callback` | Giữ nguyên (Google/Zalo đang chạy) | — |
| `/ho-tro` | Hỗ trợ, bảo hành, câu hỏi thường gặp, liên hệ | — |
| `/bay-an-toan` | Bay an toàn & cấp phép bay | — |
| `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` | Giữ nguyên nội dung | — |
| `/admin` | Quản trị (mục 10) | — |

Trang tiếng Anh `/en/*`: xem câu hỏi mở Q2. Redirect cũ khai báo trong `next.config.ts` (cùng chỗ với quy tắc tên miền gốc).

## 7. Hệ thống giao diện

### 7.1 Màu (đã đo tương phản WCAG)
| Tên | Hex | Dùng | Quy tắc |
|---|---|---|---|
| Xanh trời | `#0B6FE0` | Nút chính, link | Chữ trắng trên nền này: 4.81:1. Trên nền Trời nhạt chỉ dùng cho chữ ≥18px đậm |
| Ngọc tươi | `#13B8A6` | Nhãn, hình minh họa | **Không** đặt chữ trắng (2.49:1); chữ luôn màu Mực |
| Ngọc đậm | `#08857A` | Chữ màu ngọc trên nền trắng | 4.52:1 |
| Vàng nắng | `#FFC531` | Điểm nhấn duy nhất: Bay mô phỏng, nhãn "Mới/Bán chạy" | Chữ màu Mực |
| Trời nhạt | `#EAF4FF` | Nền ô sản phẩm, banner (chuyển sang `#E3FAF6`) | — |
| Mực | `#0F2742` | Chữ chính, footer, khung Bay thử | 15.1:1 trên trắng |
| Chữ phụ | `#4A6078` | Mô tả, chú thích | 6.49:1 trên trắng |
| Đường kẻ | `#D7E3EF` | Viền, phân cách | — |
| Giấy | `#FFFFFF` | Nền chính | — |
Khai báo bằng CSS variables + Tailwind v4 `@theme`.

### 7.2 Chữ
- **Be Vietnam Pro** qua `next/font/google` (subset `vietnamese`, `latin`), weight 300/400/600/700, một family duy nhất.
- Tên sản phẩm/tiêu đề lớn: weight 300, cỡ lớn (kiểu DJI); tiêu đề mục: 600; nội dung: 400, line-height 1.6, dòng ≤ 75 ký tự.
- Thang cỡ (px): 13 · 15 · 17 (body) · 21 · 28 · 36 · 48 · 64.

### 7.3 Icon, hình khối, chuyển động
- **Lucide** (`lucide-react`), stroke 1.75, cỡ 20/24; mọi icon có `aria-label` hoặc đi kèm chữ.
- Bo góc: ô sản phẩm 16px, ảnh 12px, nút/nhãn dạng viên thuốc (999px). Không đổ bóng đồng loạt.
- Chuyển động: một hiệu ứng banner khi tải trang; còn lại chỉ phản hồi hành động người dùng; tôn trọng `prefers-reduced-motion`.

### 7.4 Quy tắc chữ trên giao diện (từ skill frontend-design)
- Không chữ in hoa phía trên mỗi tiêu đề; không chuỗi "A · B · C"; không ký tự "›/→" gắn sau link (dùng icon `ChevronRight`).
- Nút nói đúng việc nó làm và giữ tên đó suốt luồng: "Nhận báo giá" → thông báo "Đã gửi yêu cầu báo giá".
- Viết từ góc nhìn người dùng, câu ngắn, giọng thân thiện, không hô khẩu hiệu.

### 7.5 Mẫu bố cục kiểu DJI (chỉ bố cục, không chép tài sản)
- Thanh thông báo mỏng trên cùng (tắt được).
- Header trắng cố định khi cuộn; menu: Giáo dục · Cửa hàng · Đào tạo & chứng chỉ · R&D · Bay mô phỏng (nền Vàng nắng) · Hỗ trợ; icon tìm kiếm, tài khoản, giỏ hàng; nút "Nhận tư vấn" (Xanh trời). Menu thả xuống (mega menu) cho Giáo dục và Cửa hàng. Mobile: menu kéo ra toàn màn hình.
- Banner toàn màn hình nhiều slide; lưới 2 cột ô lớn; ô "So sánh"; phần tin tức 2 cột; 4 ô màu theo cấp học; hàng 3 mục "Liên hệ & báo giá · Hỗ trợ & bảo hành · Bay an toàn & cấp phép"; footer Mực.
- Trang sản phẩm: thanh điều hướng phụ dính khi cuộn (Tổng quan / Trong hộp / Thông số / Câu hỏi / Mua hoặc Báo giá).

### 7.6 Ảnh
Bố cục này phụ thuộc ảnh đẹp. Nguồn ảnh: xem câu hỏi mở Q1. Mọi ảnh qua `next/image` (AVIF/WebP, kích thước đúng), ảnh từ R2 khai báo trong `images.remotePatterns`.

### 7.7 Chất lượng tối thiểu
Responsive tới 360px, điều khiển bằng bàn phím với viền focus rõ, alt cho mọi ảnh, LCP < 2.5s trên 4G cho trang chủ và trang sản phẩm. Rà theo Web Interface Guidelines của Vercel (`vercel-labs/web-interface-guidelines`) trước khi deploy.

## 8. Các trang chính

### 8.1 Trang chủ (thứ tự đã duyệt trên bản phác)
1. Banner: Combo Lớp học Quốc tế · Bay mô phỏng · drone học sinh bán chạy (nút theo cách mua: "Nhận báo giá"/"Thêm vào giỏ"/"Bay thử").
2. Lưới ô lớn: các combo theo cấp học, drone lẻ, linh kiện, lộ trình chứng chỉ, So sánh combo.
3. Khung "Bay thử ngay trên trình duyệt".
4. Bài R&D mới (2 bài).
5. Giải pháp theo cấp học (4 ô).
6. Đối tác / trường đã triển khai (nếu có dữ liệu thật — Q5).
7. Liên hệ · Hỗ trợ · Bay an toàn; footer.

### 8.2 Giáo dục
Giới thiệu giải pháp trọn bộ; 4 cấp học (mỗi cấp: mục tiêu học tập, combo phù hợp, giáo trình, ảnh lớp học); chương trình quốc tế (EN/VI); quy trình triển khai 4 bước (tư vấn → giao thiết bị → đào tạo giáo viên → hỗ trợ cả năm học); câu hỏi thường gặp của nhà trường (hóa đơn VAT, bảo hành, đấu thầu); kêu gọi báo giá.

### 8.3 Trang combo (`/cua-hang/combo/[slug]`)
Ảnh/video · tên · cấp học · giá tham khảo "từ …" · nút **Nhận tư vấn & báo giá** + Zalo · tải brochure PDF · thanh phụ dính · **Trong combo có gì** (danh sách sản phẩm kèm số lượng, link sang từng sản phẩm) · Giáo trình (số buổi, ngôn ngữ, mẫu bài) · Đào tạo giáo viên · **Chọn quy mô lớp** (10/20/30 học sinh → giá ước tính) · Thông số · Câu hỏi · form báo giá (tên trường, người liên hệ, SĐT, email, số học sinh, ghi chú; điền sẵn combo và quy mô đã chọn).

### 8.4 Trang drone/linh kiện (`/cua-hang/[slug]`)
Bộ ảnh · tên · giá · tình trạng kho · chọn biến thể (nếu có) · **Thêm vào giỏ** / Mua ngay · trong hộp có gì · thông số theo nhóm · tương thích (linh kiện dùng cho drone nào) · câu hỏi · sản phẩm liên quan. Sản phẩm `quote`/`preorder` hiển thị nút tương ứng.

### 8.5 Đào tạo & chứng chỉ
Danh sách khóa học (cấp độ, thời lượng, hình thức, học phí, lịch khai giảng, chỗ còn) · chi tiết + đăng ký (dùng luồng đặt chỗ khóa học đã có trong API) · trang lộ trình chứng chỉ từng bước (nội dung từ chủ dự án — Q3).

### 8.6 R&D
Danh sách bài (lọc theo chủ đề/cấp học) và chi tiết bài: mục lục tự động, ảnh, YouTube (nhúng chế độ `youtube-nocookie.com`, chỉ nhận ID YouTube), bảng, khung lưu ý, thẻ sản phẩm, tệp đính kèm, bài liên quan, chia sẻ. Dữ liệu từ API; trang làm mới theo yêu cầu khi có bài mới (mục 9.4).

### 8.7 Bay mô phỏng (`/bay-mo-phong`)
Xem mục 11.

### 8.8 Tài khoản
Hồ sơ (tên, SĐT, đổi mật khẩu với tài khoản email), **Đơn hàng của tôi** (trạng thái, chi tiết, thanh toán lại PayOS nếu còn hạn), **Khóa học của tôi**, đăng xuất.

## 9. Dữ liệu và backend (giữ NestJS + Postgres, chỉ thêm)

### 9.1 Danh mục sản phẩm — một nguồn duy nhất
Mở rộng bảng `products`/`product_variants` (migration additive):
- `kind`: `combo` | `drone` | `part` | `accessory` (đã có enum, bổ sung giá trị nếu thiếu).
- `purchaseMode`: `checkout` | `quote` | `preorder` (đã có).
- Mới: `levels` (tiểu học/THCS/THPT/đại học/quốc tế), `gallery` (danh sách media id), `specs` (nhóm → cặp khóa/giá trị), `inTheBox`, `faq`, `brochureMediaId`, `compatibleWith` (linh kiện ↔ drone), `seo` (title, description).
- Combo: bảng `combo_items` (combo → sản phẩm, số lượng) và `combo_size_tiers` (số học sinh → giá ước tính).
- Web đọc sản phẩm từ API (`GET /catalog/...`) bằng Server Components, cache theo tag; **xóa** `src/lib/commerce/storefront-catalog.ts` và nội dung sản phẩm viết cứng trong `site.ts`.
- Dữ liệu ban đầu: script nhập từ nội dung hiện có + nội dung chủ dự án cung cấp (Q4).

### 9.2 Phiên đăng nhập, giỏ hàng, đơn của tôi
- API cấp access token ngắn + refresh token; lưu trong **cookie httpOnly, Secure, SameSite=Lax, Domain=.droneviet.vn** (web và API cùng tên miền gốc). Web gọi API với `credentials: "include"` (CORS credentials đã bật). Giữ luồng Google/Zalo hiện có (mã trao đổi một lần) nhưng `exchange` đặt cookie thay vì trả token cho trang.
- `orders.userId` (nullable) — đơn tạo khi đã đăng nhập gắn với tài khoản; khách vãng lai vẫn đặt hàng và tra đơn bằng mã + SĐT như hiện nay.
- Giỏ hàng lưu `localStorage` (chỉ id biến thể + số lượng), giá và tồn kho luôn kiểm tra lại phía API khi thanh toán.
- Sửa luôn 2 lỗi đã ghi nhận: tra đơn thiếu `?phone` và `variantId` rỗng trả 400 thay vì 500.

### 9.3 Media trên R2
- Bucket `droneviet-media`; API `POST /admin/media` (multipart, ≤4MB, chỉ ảnh webp/avif/png/jpeg/svg và pdf; kiểm tra định dạng thật) → lưu R2, ghi bảng `media` (id, key, mime, kích thước, alt, nguồn/giấy phép).
- Phục vụ `GET /media/:id/:filename` từ API với `Cache-Control: public, max-age=31536000, immutable` để CDN giữ bản sao.

### 9.4 Bài viết R&D qua API
- Dùng module `content` sẵn có (articles, revisions, publish, markdown renderer); thêm: cover, tags, levels, attachments, related products.
- Markdown mở rộng bằng directive an toàn: `::youtube{id=...}`, `::product{slug=...}`, `:::note` / `:::warning`, `::file{media=...}`; render phía web, iframe chỉ cho phép YouTube.
- **Khóa đăng bài** riêng (`CONTENT_PUBLISH_TOKEN`, chỉ quyền media + bài viết), lưu Keychain `DRONEVIET_CONTENT_TOKEN`.
- Khi đăng/sửa bài hoặc sản phẩm, API gọi `POST https://www.droneviet.vn/api/revalidate` (có secret) → web làm mới tag tương ứng, bài hiện ngay không cần deploy.
- Nhập 2 bài Markdown hiện có vào database.

### 9.5 Skill viết bài trong repo
`.claude/skills/write-rd-article/SKILL.md`: giọng văn Drone Việt, cấu trúc bài theo loại (hướng dẫn, nghiên cứu, tin), chuẩn SEO, cách nén và tải ảnh (`POST /admin/media`), dùng directive YouTube/sản phẩm/lưu ý, ghi nguồn ảnh, xem trước bằng preview, đăng bằng khóa trong Keychain. AI chỉ tự tạo hình vẽ/sơ đồ (SVG); ảnh chụp do chủ dự án cung cấp hoặc nguồn có giấy phép.

### 9.6 Đào tạo
Dùng bảng `courses`, `course_sessions`, `course_enrollments` sẵn có; thêm trường mô tả, cấp độ, hình thức (trực tiếp/online), lộ trình chứng chỉ liên kết.

## 10. Admin
Tách `admin-workbench.tsx` (662 dòng) thành các trang: Tổng quan · Sản phẩm & combo (sửa thông tin, giá, tồn kho, ảnh, thành phần combo) · Đơn hàng · Yêu cầu báo giá · Khóa học & đăng ký · Bài viết (danh sách, ẩn/hiện; viết bài qua skill) · Media. Phân quyền theo vai trò đã có.

## 11. Bay mô phỏng (tập lái)
- Trang `/bay-mo-phong`, engine nạp bằng dynamic import chỉ khi vào trang và bấm "Bắt đầu"; không component nào khác import Three.js. Kiểm tra bằng phân tích bundle: trang khác không chứa `three`.
- Công nghệ: `three` + `@react-three/fiber` + `drei` (đã có trong dự án). Xóa `drone-lab-showroom.tsx` không dùng.
- Vật lý quadcopter đơn giản hóa, tự viết: lực đẩy, trọng lực, lực cản, quán tính xoay; chế độ **Angle** (tự cân bằng, mặc định cho người mới) và **Acro**; gió nhẹ tùy chọn.
- Điều khiển: bàn phím (WASD + mũi tên), **Gamepad API** (tay cầm, bộ điều khiển RC cắm USB, có bước hiệu chỉnh trục), cảm ứng hai joystick ảo trên điện thoại/máy tính bảng.
- Bài tập: cất cánh và giữ độ cao; hạ cánh vào ô; bay qua chuỗi vòng; bay số 8; mỗi bài có thời gian, độ chính xác, số lần va chạm → điểm và sao. Kết quả lưu trên máy; nếu đăng nhập thì lưu vào tài khoản (bảng `sim_results`).
- Hiệu năng: mục tiêu 60fps trên laptop phổ thông của trường; chế độ đồ họa thấp tự động khi FPS thấp; mô hình drone và sân tập tự dựng (không dùng mô hình của hãng nào).
- Trình mô phỏng tự nghĩ ra, không mô phỏng lại một game/trình mô phỏng có sẵn.

## 12. Code
- Tổ chức: `src/app` (route), `src/components/ui` (nút, ô, nhãn, form, dialog…), `src/components/<tính năng>`, `src/lib/api` (client API có kiểu dữ liệu chung), `src/features/simulator`.
- Giữ: luồng PayOS (đã sửa chữ ký, mã "00"), đăng nhập Google/Zalo + relay, trang pháp lý, trang kết quả thanh toán, các test liên quan, cấu hình redirect tên miền gốc, thẻ xác minh Zalo, `infra/zalo-relay`.
- Bỏ: `storefront-catalog.ts`, sản phẩm viết cứng trong `site.ts`, `drone-lab-showroom.tsx`, `drone-pillar-pages`/`[pillar]/[topic]`, `site-header` và `store-header` cũ (thay bằng một header).
- Test: Vitest cho logic và component; **Playwright** cho các luồng chính (xem combo → gửi báo giá; thêm drone vào giỏ → thanh toán PayOS tới bước chuyển hướng; đăng nhập email → xem đơn của tôi; mở trang mô phỏng → bay bài đầu tiên); TDD cho mọi thay đổi backend.

## 13. Bàn giao và chuyển đổi (một lần deploy)
1. Làm toàn bộ trên `rewrite/v2`; preview deploy dùng database nhánh Neon (không đụng dữ liệu production) để duyệt.
2. Trước khi chuyển: chạy toàn bộ test, Playwright trên preview, rà Web Interface Guidelines, kiểm tra redirect mọi URL cũ.
3. Chuyển: merge vào `main` → Vercel deploy web và API; migration additive chạy lúc build API; script nhập dữ liệu (sản phẩm, combo, bài viết) chạy một lần bằng cờ như `RUN_SEED` rồi gỡ cờ.
4. Sau chuyển: smoke test production (trang chủ, combo, báo giá, mua drone tới PayOS, đăng nhập Google/Zalo/email, đơn của tôi, R&D, mô phỏng, admin), kiểm tra tài khoản và đơn hàng cũ còn nguyên.
5. Rollback: Vercel "Instant Rollback" về bản trước cho cả web và API; migration chỉ thêm nên bản cũ vẫn chạy với database mới.

## 14. Để người làm tự quyết
Cấu trúc component chi tiết, thư viện form/validation (giữ Zod), thuật toán vật lý cụ thể, chiến lược cache chi tiết, cách chia mega menu, nội dung chữ phụ (theo quy tắc mục 7.4).

## 15. Quyết định do người thiết kế tự đưa ra (chủ dự án kiểm tra lại)
- Tên đường dẫn: `/giao-duc`, `/cua-hang/combo/...`, `/dao-tao`, `/r-d`, `/bay-mo-phong`, `/ho-tro`, `/bay-an-toan`, `/tai-khoan`.
- Phiên đăng nhập bằng cookie httpOnly trên `.droneviet.vn`; giỏ hàng lưu trên trình duyệt.
- Preview deploy dùng nhánh database Neon riêng.
- YouTube nhúng chế độ không cookie; chỉ chấp nhận video YouTube.
- Vật lý trình mô phỏng tự viết (không dùng engine vật lý ngoài) để nhẹ.
- Danh sách code bỏ đi ở mục 12.
- Không hiển thị số liệu hay logo trường đối tác nào khi chưa có dữ liệu thật (mục 8.1 phần 6 ẩn đi).

## 16. Trả lời của chủ dự án (2026-11-23)
Thiết kế được duyệt. Q1–Q6 dùng **nội dung mẫu**, không có hạn chót (Q7). Quy tắc nội dung mẫu:
- Mọi nội dung mẫu nằm trong database/admin (sửa được không cần deploy), không viết cứng trong code.
- Sản phẩm lẻ: dùng dữ liệu đang hiển thị công khai trên web hiện tại (tên, giá, mô tả, ảnh Wikimedia có ghi nguồn).
- Combo: thành phần lấy từ sản phẩm hiện có; giá hiển thị **"Liên hệ báo giá"** cho đến khi admin nhập bậc giá theo quy mô — không bịa giá.
- Ảnh: ảnh hiện có + ô minh họa trung tính; ảnh render 3D làm sau nếu cần.
- Chứng chỉ, khóa học: khung đầy đủ, nội dung đánh dấu "Đang cập nhật".
- Tiếng Anh (Q4): theo đề xuất — trang chủ, Giáo dục, combo; các trang khác chỉ tiếng Việt.
- Khóa học (Q5): đăng ký giữ chỗ rồi liên hệ (không thanh toán online trong v2).
- Liên hệ (Q6): Zalo 0384070636 + "Đang cập nhật" cho email/hotline/địa chỉ, sửa được trong admin (bảng cài đặt chung).
- Phần "trường đối tác" ẩn cho đến khi có dữ liệu.

## 17. Câu hỏi mở cho chủ dự án (từ lượt rà soát của người xây dựng)
- **Q1. Ảnh:** đã có ảnh chụp sản phẩm và lớp học thật chưa? Nếu chưa: dùng ảnh render 3D drone (dựng bằng engine của trình mô phỏng) cho đến khi có ảnh thật.
- **Q2. Nội dung thật:** danh sách sản phẩm bán online (tên, giá, tồn kho, thông số), các combo (thành phần, số lượng, giá theo 10/20/30 học sinh, brochure), khóa học (học phí, lịch). Ai cung cấp, khi nào? Không deploy giá hay thông số giả.
- **Q3. Chứng chỉ:** chứng chỉ gì, do đơn vị nào cấp, các bước, chi phí, thời gian? (Không tự viết quy trình pháp lý.)
- **Q4. Tiếng Anh:** giữ trang tiếng Anh cho những trang nào (đề xuất: trang chủ, Giáo dục, combo — phục vụ lớp quốc tế)?
- **Q5. Khóa học:** đăng ký có thanh toán online qua PayOS, hay chỉ giữ chỗ rồi liên hệ?
- **Q6. Thông tin liên hệ và pháp nhân:** tên đơn vị, email, hotline, địa chỉ (cho footer, trang Hỗ trợ, chính sách bảo mật).
- **Q7. Hạn chót:** có mốc cần lên web (ví dụ trước kỳ tuyển sinh/đấu thầu) không? Vì chỉ deploy một lần, mốc này quyết định phạm vi v2.
