# Workshop, chứng chỉ, cấp phép, quy định và bản đồ khu vực bay

Ngày: 2026-11-23 · Nhánh: `rewrite/v2` · Trạng thái: chủ dự án duyệt hướng làm trong hội thoại ("oke làm đi").

## Vì sao

Người xem site (trường học, giáo viên, học viên, người chơi drone) hỏi nhiều nhất ba việc: cho học sinh trải nghiệm drone thế nào, bay có cần giấy phép không, và bay ở đâu thì được. Site v2 mới có khung "Đang cập nhật" cho chứng chỉ và cấp phép, chưa có workshop và bản đồ.

## Quyết định của chủ dự án

- Workshop trải nghiệm nằm trong **Giáo dục**. Các trang còn lại nằm trong **Đào tạo & chứng chỉ**.
- Nội dung pháp lý viết bằng **Markdown, đăng qua hệ thống bài viết** có sẵn (`npm run rd:publish`, admin Bài viết), sửa được không cần deploy.
- Bản đồ **tương tác Leaflet + OpenStreetMap**, dữ liệu vùng bay của Việt Nam.
- Workshop gồm: giới thiệu nội dung, lịch, form đăng ký nhận thông tin, link nhóm Zalo.

## Mục tiêu / không làm / không được xảy ra

- Mục tiêu: 5 trang có nội dung thật, mỗi ý pháp lý ghi nguồn (số văn bản, điều, khoản); bản đồ giúp người dùng biết chỗ mình định bay có thể nằm trong vùng cấm/hạn chế; trường học đăng ký workshop không cần tài khoản.
- Không làm: tư vấn pháp lý từng trường hợp; nộp hồ sơ xin phép thay người dùng; thanh toán workshop online.
- Không được xảy ra: nội dung pháp lý sai hoặc không có nguồn; bản đồ khiến người dùng tin chắc "chỗ này bay được" (vùng quân sự, trụ sở không công khai, nên bản đồ chỉ tham khảo và luôn dẫn tới bản đồ chính thức); bản đồ thiếu Hoàng Sa, Trường Sa thuộc Việt Nam; thư viện bản đồ làm nặng các trang khác.

## Nguồn pháp lý đã kiểm (2026-11-23)

- Luật Phòng không nhân dân số 49/2024/QH15 (hiệu lực 01/7/2025; sửa đổi bởi Luật 98/2025/QH15).
- Nghị định 288/2025/NĐ-CP (Công báo số 1589+1590 ngày 18/11/2025, đã đọc bản gốc): phân loại (Đ4), điều kiện khai thác (Đ19; khoản 1 và 3 hiệu lực 01/7/2026), cấp phép bay (Đ21–25), giấy phép điều khiển Hạng A/B (Đ27–29), hiệu lực và văn bản hết hiệu lực (Đ34).
- Quyết định 18/2020/QĐ-TTg: khu vực cấm bay (Đ3) và hạn chế bay (Đ4). Đọc qua bản chép lại, cần đối chiếu Công báo trước khi đăng.
- Bản đồ chính thức của Bộ Quốc phòng: https://cambay.mod.gov.vn (công bố từ 15/6/2025). API dữ liệu của trang này trả 403 cho website khác, nên **không lấy dữ liệu từ đó**; chỉ dẫn link.
- Mức phạt: Nghị định 282/2025/NĐ-CP, Điều 8 (hiệu lực 15/12/2025). Chưa đọc được bản gốc, nên bài viết chỉ dẫn chiếu điều khoản, không ghi con số; chủ dự án bổ sung sau khi kiểm.

## Cách làm (đã chọn)

### Nội dung pháp lý: bài viết loại `phap-ly`

- Thêm `kind: phap-ly` cho bài viết. API `/content/articles` mặc định **không trả** bài `phap-ly` (để không lẫn vào R&D, tìm kiếm, tin trang chủ); `?kind=phap-ly` lấy riêng.
- 4 bài trong `content/phap-ly/<slug>/index.md`, đăng bằng `npm run rd:publish` (script nhận đường dẫn thư mục bất kỳ): `giay-phep-dieu-khien-drone`, `cap-phep-bay-drone`, `quy-dinh-phap-ly-drone`, `khu-vuc-cam-bay-drone` (giải thích cho trang bản đồ).
- Mỗi trang: phần khung cố định trong code (tiêu đề, tóm tắt nhanh, nút liên hệ, liên kết sang trang liên quan) + thân bài từ bài viết. Bài chưa đăng thì trang hiện khung với "Đang cập nhật", không lỗi.
- Mỗi bài có dòng "Cập nhật ngày …, thông tin tham khảo, không thay thế văn bản pháp luật" và danh sách nguồn.
- Đổi cách gọi theo luật: văn bản dùng "Giấy phép điều khiển phương tiện bay" (Hạng A, Hạng B), trang vẫn ở `/dao-tao/chung-chi` và menu ghi "Chứng chỉ, giấy phép bay".

### Trang và menu

| Trang | Đường dẫn |
|---|---|
| Workshop trải nghiệm drone | `/giao-duc/workshop` |
| Chứng chỉ, giấy phép bay | `/dao-tao/chung-chi` (đã có, thay nội dung) |
| Cấp phép bay | `/dao-tao/cap-phep` |
| Quy định pháp lý | `/dao-tao/quy-dinh` |
| Bản đồ khu vực bay | `/dao-tao/ban-do` |

- Menu Giáo dục thêm "Workshop trải nghiệm". Menu Đào tạo & chứng chỉ có danh sách thả xuống: Khóa học, Chứng chỉ, Cấp phép bay, Quy định pháp lý, Bản đồ khu vực bay.
- `/bay-an-toan` giữ nguyên tắc an toàn, phần "Quy định và cấp phép" đổi thành liên kết sang 3 trang mới. `/giao-duc` thêm khối workshop. `/dao-tao` thêm lưới liên kết 4 trang. Sitemap thêm 4 trang mới.
- `/giao-duc/[cap]` là route động: `workshop` phải là route tĩnh riêng, không bị hiểu là một cấp học.

### Bản đồ khu vực bay

- Leaflet (không dùng react-leaflet), nền OpenStreetMap, nạp động chỉ khi vào trang `/dao-tao/ban-do` (giống cách tải engine bay mô phỏng; có test chặn import `leaflet` ngoài thư mục bản đồ).
- Dữ liệu vùng tự dựng từ văn bản công khai, bằng script `scripts/flight-zones/build.mjs` (chạy tay, kết quả commit vào `public/geo/flight-zones.json`, ghi ngày dựng):
  - **Sân bay** (QĐ 18/2020 Đ3.4, Đ4.4): đường băng lấy từ OpenStreetMap (Overpass, `aeroway=runway` trong Việt Nam, bỏ đường băng bỏ hoang hoặc dưới 1.000 m). Vùng cấm: hình chữ nhật kéo dài 15 km khỏi hai đầu, rộng 5 km mỗi bên tim đường băng (nhiều đường băng: bao các đường băng ngoài cùng). Vùng hạn chế tiếp giáp: thêm 3 km chiều rộng, 5 km chiều dài, dưới 120 m.
  - **Biên giới** (Đ4.3): dải 25 km dọc biên giới Trung Quốc, 10 km dọc Lào và Campuchia, phía Việt Nam; đường biên từ Natural Earth (public domain), cắt theo lãnh thổ đất liền.
  - Không vẽ: công trình quốc phòng, trụ sở (Đ3.1–3.3) vì không có dữ liệu công khai; khu đông người; độ cao trên 120 m. Ba mục này ghi thành chú thích cố định trên bản đồ.
- Nhãn chủ quyền riêng trên bản đồ: "Quần đảo Hoàng Sa (Việt Nam)", "Quần đảo Trường Sa (Việt Nam)". Nền OSM có thể hiện tên khác khi phóng to; đổi sang nền bản đồ Việt Nam (vd Vietmap) chỉ cần thay URL nền, để ngỏ cho chủ dự án.
- Chức năng: tìm địa điểm (Nominatim, giới hạn Việt Nam), nút "Vị trí của tôi", bấm vào bản đồ để biết điểm đó nằm trong vùng nào (kiểm tra điểm trong đa giác ngay trên máy). Chú giải màu, ghi nguồn OSM/Natural Earth/QĐ 18/2020, nút lớn "Kiểm tra trên bản đồ chính thức của Bộ Quốc phòng".

### Workshop: dùng hệ thống khóa học

- Workshop là khóa học có `level = "workshop"`. Lịch = các đợt học, đăng ký = form đặt chỗ hiện có (không cần đăng nhập).
- Thêm cột `zaloGroupUrl` (nullable) cho khóa học: hiện trên trang và trong thông báo sau khi đăng ký. Admin Khóa học sửa được trường này.
- Form đăng ký thêm trường tùy chọn: trường/đơn vị, số người tham gia, ghi chú. Lưu trong `course_enrollments` (cột mới `organization`, `note`; `quantity` dùng cho số người, mặc định 1).
- Trang `/giao-duc/workshop`: giới thiệu (nội dung buổi, đối tượng, thời lượng, hình thức tại trường hoặc tại Drone Việt) từ `descriptionMarkdown` của khóa workshop đầu tiên, lịch các đợt sắp tới, form, nút nhóm Zalo. Chưa có khóa workshop: hiện giới thiệu mặc định + nút liên hệ Zalo chung.

## Các phương án đã cân nhắc

| Phần | Đã chọn | Phương án khác và lý do không chọn |
|---|---|---|
| Nội dung pháp lý | Bài viết Markdown | Viết cứng trong code: mỗi lần luật đổi phải deploy |
| Bản đồ | Leaflet + OSM, vùng tự dựng | Ảnh tĩnh: không tìm được vị trí. Lấy dữ liệu từ cambay.mod.gov.vn: bị chặn (403), không phù hợp vượt chặn. Nền Vietmap: chuẩn chủ quyền nhưng cần khóa API, để sau |
| Workshop | Khóa học `level=workshop` | Form báo giá: không có lịch và số chỗ như chủ dự án muốn |

## Việc để người làm tự quyết

Bố cục chi tiết từng trang theo các trang hiện có; màu vùng trên bản đồ; độ đơn giản hóa đa giác (giữ file dữ liệu dưới ~300 KB).
