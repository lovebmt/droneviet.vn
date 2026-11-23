# DroneViet.vn

Website của Drone Việt: giải pháp drone trọn bộ cho giáo dục (combo lớp học), cửa hàng drone và linh kiện,
đào tạo & chứng chỉ, bài viết R&D và bay mô phỏng trên trình duyệt.

v2 đang được viết lại trên branch `rewrite/v2` — xem
`docs/superpowers/specs/2026-11-23-droneviet-v2-rewrite-design.md` và
`docs/superpowers/plans/2026-11-23-v2-roadmap.md`.

## Cấu trúc

- `src/` — web Next.js (App Router). Đọc `node_modules/next/dist/docs/` trước khi sửa (xem AGENTS.md).
- `backend/` — API NestJS + Postgres (Neon trên production), chạy ở `api.droneviet.vn`.
- `infra/zalo-relay/` — relay lấy hồ sơ Zalo từ IP Việt Nam (chạy trên server103).

## Chạy trên máy

```bash
docker compose up -d postgres            # Postgres local ở cổng 5433
cd backend && npm install
DATABASE_URL=postgres://droneviet:droneviet@localhost:5433/droneviet npm run migration:run
DATABASE_URL=postgres://droneviet:droneviet@localhost:5433/droneviet npm run seed:v2
npm run start:dev                         # API ở http://localhost:4000

cd .. && npm install
NEXT_PUBLIC_COMMERCE_API_URL=http://localhost:4000 npm run dev   # web ở http://localhost:3000
```

## Kiểm tra

```bash
npm run lint && npm run test && npm run build        # web
cd backend && TEST_DATABASE_URL=postgres://droneviet:droneviet@localhost:5433/droneviet_test npm test && npm run build
```

Test tích hợp dùng database riêng `droneviet_test` (tạo một lần: `CREATE DATABASE droneviet_test`).
