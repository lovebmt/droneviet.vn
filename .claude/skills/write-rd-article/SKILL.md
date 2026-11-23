---
name: write-rd-article
description: Use when asked to write, edit, translate or publish an R&D / blog / tin tức / hướng dẫn article for droneviet.vn ("viết bài R&D", "đăng bài", "bài hướng dẫn lắp ráp", "tin mới"). Covers Drone Việt voice, article structure, front matter, images (compress, credit, upload to R2), YouTube and product embeds, preview, and publishing through the API without a deploy.
---

# Viết và đăng bài R&D cho droneviet.vn

Bài viết là một thư mục `content/rd/<slug>/` gồm `index.md` và các ảnh/tệp đi kèm. Script `npm run rd:publish` tải ảnh lên R2 qua API, lưu bài và (tuỳ chọn) đăng. Web hiện bài trong vài giây, không cần deploy.

## Quy trình

1. **Hỏi chủ dự án** nếu chưa rõ: chủ đề, người đọc (học sinh cấp nào, giáo viên, nhà trường), loại bài (`guide` hướng dẫn, `research` nghiên cứu, `news` tin), sản phẩm liên quan, ảnh chụp có sẵn.
2. Tạo `content/rd/<slug>/index.md` từ mẫu `content/rd/_mau-bai-viet/index.md`. Slug: chữ thường không dấu, gạch ngang (`lap-rap-drone-f450`).
3. Chuẩn bị ảnh (mục Ảnh), đặt cạnh `index.md`, chèn bằng đường dẫn tương đối `./ten-anh.webp`.
4. Kiểm tra: `npm run rd:publish -- content/rd/<slug> --dry-run` (không gửi gì, báo lỗi đường dẫn/định dạng/kích thước).
5. Xem trước trên máy (mục Xem trước), sửa đến khi ổn.
6. Đưa chủ dự án duyệt nội dung. **Chỉ đăng khi được đồng ý**:
   - Lưu bản nháp: `npm run rd:publish -- content/rd/<slug>`
   - Đăng ngay: `npm run rd:publish -- content/rd/<slug> --publish`
   Bản nháp có thể đăng/ẩn sau ở `/admin/bai-viet`.
7. Commit thư mục bài viết (nguồn của bài nằm trong repo; sửa bài = sửa file rồi chạy lại lệnh, slug là khóa nên không tạo bài trùng).

## Front matter

```yaml
---
slug: lap-rap-drone-f450            # bắt buộc, không đổi sau khi đăng
title: Lắp ráp drone F450 cho lớp 8  # ≤ 70 ký tự, nói rõ người đọc được gì
summary: Một câu 120–160 ký tự, dùng làm mô tả SEO nếu không có seoDescription.
kind: guide                          # guide | research | news
locale: vi
tags: [lap-rap, thcs]                # chữ thường không dấu; dùng lại tag cũ khi có thể
levels: [thcs]                       # tieu-hoc | thcs | thpt | dai-hoc | quoc-te
cover: ./bia.webp                    # ảnh bìa 16:9 hoặc 2:1
related: [dv-code-fleet]             # slug sản phẩm, hiện thẻ "Sản phẩm trong bài"
attachments:                         # tệp tải về (PDF giáo án, sơ đồ)
  - src: ./giao-an.pdf
    label: Giáo án 2 tiết
imageSource: "Ảnh: Drone Việt"       # ghi vào thư viện media cho mọi ảnh của bài
seoTitle: ...                        # tuỳ chọn
seoDescription: ...                  # tuỳ chọn
---
```

## Nội dung Markdown

- Bắt đầu bằng 1–2 câu nói người đọc sẽ làm/hiểu được gì. Không lặp lại tiêu đề.
- Tiêu đề mục dùng `##` và `###` (tạo mục lục tự động). Không dùng `#` trong thân bài.
- Câu ngắn, chủ động, viết cho đúng cấp học. Thuật ngữ tiếng Anh lần đầu kèm giải thích.
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

## Trung thực (bắt buộc)

- Không bịa số liệu, giá, kết quả thí nghiệm, tên trường/đối tác, trích dẫn, quy định pháp lý. Thiếu thông tin thì hỏi chủ dự án hoặc ghi "Đang cập nhật".
- Quy định bay/cấp phép chỉ nêu khi có nguồn chính thức (ghi nguồn); nếu chưa xác minh, dẫn người đọc tới `/bay-an-toan`.
- Ghi nguồn cho mọi trích dẫn và ảnh không phải của Drone Việt.

## Ảnh

- Ảnh chụp: do chủ dự án cung cấp hoặc nguồn có giấy phép cho phép dùng (CC BY, CC BY-SA, CC0…). Ghi tác giả và giấy phép trong alt hoặc dòng chú thích: `![Học sinh lắp khung. Ảnh: Drone Việt](./lap-khung.webp)`.
- AI chỉ tự tạo **hình vẽ, sơ đồ dạng SVG** (không script, không sự kiện `on…`). Không tạo ảnh giả làm ảnh chụp.
- Định dạng: WebP (ưu tiên), AVIF, PNG, JPEG, SVG; PDF cho tài liệu. Tối đa 4 MB mỗi tệp.
- Nén trước khi đăng:
  ```bash
  sips -Z 1600 anh-goc.jpg --out /tmp/anh.jpg      # cạnh dài tối đa 1600 px
  cwebp -q 80 /tmp/anh.jpg -o content/rd/<slug>/anh.webp
  ```
- Alt mô tả nội dung ảnh cho người không xem được ảnh, không bắt đầu bằng "Ảnh về…".

## SEO

- Tiêu đề chứa từ khóa chính tự nhiên; summary 120–160 ký tự; slug ngắn.
- 1 ảnh bìa, ảnh trong bài có alt; liên kết nội bộ tới trang liên quan (`/giao-duc/thcs`, `/cua-hang/...`, `/dao-tao`).

## Xem trước trên máy

Chạy API và web local (xem skill `connect-infra` hoặc README), rồi:

```bash
DRONEVIET_CONTENT_TOKEN=<khóa local> npm run rd:publish -- content/rd/<slug> --publish --api http://localhost:4000
# mở http://localhost:3000/r-d/<slug>
```

## Khóa đăng bài

- Production đọc khóa từ biến môi trường `DRONEVIET_CONTENT_TOKEN`, nếu không có thì từ Keychain macOS mục `DRONEVIET_CONTENT_TOKEN` (`security find-generic-password -s DRONEVIET_CONTENT_TOKEN -w`).
- Khóa chỉ có quyền media và bài viết. **Không in khóa ra màn hình, không ghi vào file, không commit.**
- API mặc định `https://api.droneviet.vn`; đổi bằng `--api URL` hoặc biến `DRONEVIET_API_URL`.

## Thư mục đặc biệt

- `content/rd/_mau-bai-viet/`: mẫu, không đăng lên production.
- `content/rd/_en/`: bản tiếng Anh của bài cũ, chưa đăng (website chưa có mục R&D tiếng Anh).
