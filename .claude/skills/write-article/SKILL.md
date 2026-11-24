---
name: write-article
description: Use when asked to write, edit, translate or publish any article or written page content for droneviet.vn — R&D / blog / tin tức / hướng dẫn, or a legal guide (giấy phép, cấp phép bay, quy định pháp lý, khu vực cấm bay) — e.g. "viết bài", "đăng bài", "bài hướng dẫn lắp ráp", "tin mới", "viết bài pháp lý", "cập nhật trang quy định". Covers where the local source lives, voice, front matter, images (compress, credit, upload to R2), embeds, sources and disclaimers, preview, and publishing through the API without a deploy.
---

# Viết và đăng bài cho droneviet.vn

Mọi bài viết đều theo một luồng: **bản gốc nằm trong repo**, đăng lên **API → database** bằng một lệnh, web hiện bài trong vài giây, **không cần deploy**.

```
content/<khu-vực>/<slug>/index.md (+ ảnh, PDF)     ← bản gốc, commit vào git
        │  npm run content:publish -- content/<khu-vực>/<slug> [--publish]
        ▼
API (bài viết + ảnh lên R2) → database → web
```

Không viết hay sửa bài trực tiếp trong admin hoặc database mà không có bản gốc trong `content/`. Sửa trong admin thì cập nhật lại file cho khớp.

## Loại nội dung

| Khu vực | Thư mục | `kind` | Hiện ở đâu |
|---|---|---|---|
| R&D: hướng dẫn | `content/rd/<slug>/` | `guide` | `/r-d/<slug>`, danh sách R&D, tìm kiếm, sitemap |
| R&D: nghiên cứu | `content/rd/<slug>/` | `research` | như trên |
| R&D: tin | `content/rd/<slug>/` | `news` | như trên |
| Pháp lý | `content/phap-ly/<slug>/` | `phap-ly` | Thân bài của trang trong `src/content/legal.ts` (`LEGAL_PAGES[].articleSlug`). Không hiện ở R&D, tìm kiếm, tin trang chủ |

Bài `phap-ly` không có trang riêng. Hiện có 4 bài, mỗi bài là thân của một trang:

| Trang | `articleSlug` |
|---|---|
| `/dao-tao/chung-chi` | `giay-phep-dieu-khien-drone` |
| `/dao-tao/cap-phep` | `cap-phep-bay-drone` |
| `/dao-tao/quy-dinh` | `quy-dinh-phap-ly-drone` |
| `/dao-tao/ban-do` | `khu-vuc-cam-bay-drone` |

- **Nội dung pháp lý mới:** viết thêm mục vào bài của trang phù hợp (đăng lại là xong, không deploy).
- **Muốn trang pháp lý riêng:** cần thêm mục vào `LEGAL_PAGES`, tạo route `src/app/dao-tao/<slug>/page.tsx` gọi `LegalPageView`, thêm vào menu `src/components/site/nav.ts`, sitemap và test. Việc này là code, phải deploy; hỏi chủ dự án trước.

Không phải bài viết (skill này không áp dụng): mô tả sản phẩm, combo, khóa học, workshop sửa trong admin; nội dung cố định của trang chủ, cấp học, phần giới thiệu workshop nằm trong `src/content/*.ts`.

## Quy trình

1. **Hỏi chủ dự án** nếu chưa rõ: chủ đề, người đọc (học sinh cấp nào, giáo viên, nhà trường), khu vực và `kind`, sản phẩm liên quan, ảnh có sẵn. Bài pháp lý: trang nào sẽ chứa nội dung.
2. Tạo `content/<khu-vực>/<slug>/index.md`. R&D: từ mẫu `content/rd/_mau-bai-viet/index.md`. Pháp lý: theo mục "Bài pháp lý". Slug: chữ thường không dấu, gạch ngang (`lap-rap-drone-f450`).
3. Chuẩn bị ảnh (mục Ảnh), đặt cạnh `index.md`, chèn bằng đường dẫn tương đối `./ten-anh.webp`.
4. Kiểm tra: `npm run content:publish -- content/<khu-vực>/<slug> --dry-run` (không gửi gì, báo lỗi đường dẫn, định dạng, kích thước).
5. Xem trước trên máy (mục Xem trước), sửa đến khi ổn.
6. Đưa chủ dự án duyệt nội dung. **Chỉ đăng khi được đồng ý**:
   - Lưu bản nháp: `npm run content:publish -- content/<khu-vực>/<slug>`
   - Đăng ngay: `npm run content:publish -- content/<khu-vực>/<slug> --publish`
   Bản nháp đăng/ẩn sau ở `/admin/bai-viet`.
7. Commit thư mục bài (sửa bài = sửa file rồi chạy lại lệnh; slug là khóa nên không tạo bài trùng).

`npm run rd:publish` là tên cũ của cùng lệnh, vẫn dùng được.

## Front matter

```yaml
---
slug: lap-rap-drone-f450            # bắt buộc, không đổi sau khi đăng
title: Lắp ráp drone F450 cho lớp 8  # ≤ 70 ký tự, nói rõ người đọc được gì
summary: Một câu 120–160 ký tự, dùng làm mô tả SEO nếu không có seoDescription.
kind: guide                          # guide | research | news | phap-ly
locale: vi
tags: [lap-rap, thcs]                # chữ thường không dấu; dùng lại tag cũ khi có thể
levels: [thcs]                       # tieu-hoc | thcs | thpt | dai-hoc | quoc-te
cover: ./bia.webp                    # ảnh bìa 16:9 hoặc 2:1 (R&D)
related: [dv-code-fleet]             # slug sản phẩm, hiện thẻ "Sản phẩm trong bài"
attachments:                         # tệp tải về (PDF giáo án, sơ đồ)
  - src: ./giao-an.pdf
    label: Giáo án 2 tiết
imageSource: "Ảnh: Drone Việt"       # ghi vào thư viện media cho mọi ảnh của bài
seoTitle: ...                        # tuỳ chọn
seoDescription: ...                  # tuỳ chọn
---
```

Bài pháp lý dùng: `kind: phap-ly`, `tags: [phap-ly]`, `levels: []`, không `cover`, không `related`.

## Nội dung Markdown

- Bắt đầu bằng 1–2 câu nói người đọc sẽ làm/hiểu được gì. Không lặp lại tiêu đề.
- Tiêu đề mục dùng `##` và `###` (tạo mục lục tự động). Không dùng `#` trong thân bài.
- Câu ngắn, chủ động, viết cho đúng người đọc. Thuật ngữ tiếng Anh lần đầu kèm giải thích. Không dùng gạch ngang dài; số thập phân dùng dấu phẩy (0,25 kg).
- Chèn đặc biệt (chỉ những dạng này được hiển thị, dạng khác bị bỏ):
  - Video: `::youtube{id=VIDEO_ID}` (đúng 11 ký tự id, chỉ YouTube)
  - Thẻ sản phẩm: `::product{slug=dv-code-fleet}`
  - Ghi chú / cảnh báo an toàn:
    ```
    :::note
    Nội dung ghi chú.
    :::
    ```
    (`:::warning` cho cảnh báo)
  - Nút tải tệp: `::file{src=./so-do.pdf label="Tải sơ đồ"}`
- Không dùng HTML thô (bị bỏ khi hiển thị). Bảng Markdown (GFM) được hỗ trợ.

### Bố cục theo loại bài

- **guide**: Mục tiêu, Chuẩn bị (thiết bị, thời gian, an toàn), Các bước (`###` mỗi bước, có ảnh), Kiểm tra kết quả, Lỗi thường gặp, Gợi ý mở rộng cho lớp học.
- **research**: Câu hỏi, Bối cảnh, Cách làm (thiết bị, quy trình đo), Kết quả (số liệu thật, có đơn vị), Hạn chế, Kết luận, Nguồn tham khảo.
- **news**: Sự kiện gì, ở đâu, khi nào, ai tham gia, ý nghĩa cho trường học, ảnh sự kiện.
- **phap-ly**: xem mục dưới.

## Bài pháp lý

Sai một con số trong bài pháp lý có thể khiến người đọc bị phạt, nên:

1. **Đọc văn bản gốc**, không viết từ bài báo hay blog. Nguồn ưu tiên: Công báo (congbao.chinhphu.vn), vbpl.vn, Cổng Chính phủ. Bản chép lại (thuvienphapluat, trang của đại lý) chỉ để tham khảo và phải ghi rõ "chưa đối chiếu bản gốc".
2. **Mỗi ý một dẫn chiếu** ngay trong câu: số văn bản + điều, khoản, điểm, ví dụ "(Nghị định 288/2025/NĐ-CP, Điều 21 khoản 1 điểm b)".
3. **Không ghi con số chưa đọc được trong bản gốc** (mức phạt, lệ phí, thời hạn). Dẫn chiếu điều khoản và để chủ dự án bổ sung.
4. **Văn bản hiện hành** (cập nhật khi có văn bản mới): Luật Phòng không nhân dân 49/2024/QH15 (sửa đổi bởi 98/2025/QH15); Nghị định 288/2025/NĐ-CP (quản lý drone, giấy phép, cấp phép bay); Quyết định 18/2020/QĐ-TTg (khu vực cấm, hạn chế bay); Nghị định 282/2025/NĐ-CP Điều 8 (xử phạt). Nghị định 36/2008/NĐ-CP đã hết hiệu lực. Bản đồ chính thức: https://cambay.mod.gov.vn.
5. **Kết thúc bài** bằng mục `## Nguồn` (liệt kê văn bản, số Công báo, các điều đã dẫn) và đúng dòng:
   `*Cập nhật ngày DD/MM/YYYY. Thông tin tham khảo, không thay thế văn bản pháp luật. Trường hợp cụ thể, hãy hỏi cơ quan có thẩm quyền hoặc liên hệ Drone Việt.*`
6. Tóm tắt nhanh trên trang (`keyPoints` trong `src/content/legal.ts`) là code: nếu bài đổi ý chính, cập nhật `keyPoints` cho khớp (cần deploy).

## Trung thực (bắt buộc)

- Không bịa số liệu, giá, kết quả thí nghiệm, tên trường/đối tác, trích dẫn, quy định pháp lý. Thiếu thông tin thì hỏi chủ dự án hoặc ghi "Đang cập nhật".
- Quy định bay/cấp phép trong bài R&D: tóm tắt một câu và dẫn người đọc tới trang pháp lý (`/dao-tao/cap-phep`, `/dao-tao/quy-dinh`), không viết lại quy định.
- Ghi nguồn cho mọi trích dẫn và ảnh không phải của Drone Việt.

## Ảnh

- Ảnh chụp: do chủ dự án cung cấp hoặc nguồn có giấy phép cho phép dùng (CC BY, CC BY-SA, CC0…). Ghi tác giả và giấy phép trong alt hoặc dòng chú thích: `![Học sinh lắp khung. Ảnh: Drone Việt](./lap-khung.webp)`.
- AI chỉ tự tạo **hình vẽ, sơ đồ dạng SVG** (không script, không sự kiện `on…`). Không tạo ảnh giả làm ảnh chụp.
- Định dạng: WebP (ưu tiên), AVIF, PNG, JPEG, SVG; PDF cho tài liệu. Tối đa 4 MB mỗi tệp.
- Nén trước khi đăng:
  ```bash
  sips -Z 1600 anh-goc.jpg --out /tmp/anh.jpg      # cạnh dài tối đa 1600 px
  cwebp -q 80 /tmp/anh.jpg -o content/<khu-vực>/<slug>/anh.webp
  ```
- Alt mô tả nội dung ảnh cho người không xem được ảnh, không bắt đầu bằng "Ảnh về…".

## SEO

- Tiêu đề chứa từ khóa chính tự nhiên; summary 120–160 ký tự; slug ngắn.
- Ảnh có alt; liên kết nội bộ tới trang liên quan (`/giao-duc/thcs`, `/giao-duc/workshop`, `/cua-hang/...`, `/dao-tao/chung-chi`).
- Bài đăng xong tự vào sitemap (R&D) và `llms.txt` / `llms-full.txt` (R&D và pháp lý), không cần làm gì thêm.

## Xem trước trên máy

Chạy API và web local (xem skill `connect-infra` hoặc README), rồi:

```bash
DRONEVIET_CONTENT_TOKEN=<khóa local> npm run content:publish -- content/<khu-vực>/<slug> --publish --api http://localhost:4000
# R&D: http://localhost:3000/r-d/<slug>   Pháp lý: trang chứa bài, ví dụ http://localhost:3000/dao-tao/cap-phep
```

## Khóa đăng bài

- Production đọc khóa từ biến môi trường `DRONEVIET_CONTENT_TOKEN`, nếu không có thì từ Keychain macOS mục `DRONEVIET_CONTENT_TOKEN` (`security find-generic-password -s DRONEVIET_CONTENT_TOKEN -w`).
- Khóa chỉ có quyền media và bài viết. **Không in khóa ra màn hình, không ghi vào file, không commit.**
- API mặc định `https://api.droneviet.vn`; đổi bằng `--api URL` hoặc biến `DRONEVIET_API_URL`.

## Thư mục đặc biệt

- `content/rd/_mau-bai-viet/`: mẫu, không đăng lên production.
- `content/rd/_en/`: bản tiếng Anh của bài cũ, chưa đăng (website chưa có mục R&D tiếng Anh).

## Lỗi thường gặp

| Lỗi | Cách đúng |
|---|---|
| Viết bài thẳng trong admin | Viết file trong `content/` rồi đăng bằng lệnh |
| Bài pháp lý đặt trong `content/rd/` hoặc `kind: guide` | `content/phap-ly/`, `kind: phap-ly` |
| Tạo bài pháp lý mới và mong nó tự có trang | Thêm vào bài của trang có sẵn, hoặc hỏi để thêm trang (code + deploy) |
| Đăng trước khi chủ dự án duyệt | Dry-run, xem trước, chờ đồng ý rồi `--publish` |
| Ghi mức phạt/lệ phí từ báo | Chỉ ghi khi đọc được trong văn bản gốc; không thì dẫn chiếu điều khoản |
