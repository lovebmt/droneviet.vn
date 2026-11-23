"use client";

import Link from "next/link";
import { useAdminUser } from "@/components/admin/admin-context";
import { canOpen } from "@/components/admin/sections";
import { useAdminData } from "@/components/admin/use-admin-data";

type WithStatus = { status: string };

function Tile({ href, title, value, note }: { href: string; title: string; value: string; note: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-line p-6 hover:border-sky">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </Link>
  );
}

export default function AdminHome() {
  const user = useAdminUser();
  const quotes = useAdminData<WithStatus[]>(canOpen(user.roles, "/admin/bao-gia") ? "/admin/quotes" : null);
  const orders = useAdminData<WithStatus[]>(canOpen(user.roles, "/admin/don-hang") ? "/admin/orders" : null);
  const articles = useAdminData<WithStatus[]>(canOpen(user.roles, "/admin/bai-viet") ? "/admin/content/articles" : null);
  const count = (list: WithStatus[] | null, statuses: string[]) => (list ? list.filter((x) => statuses.includes(x.status)).length : null);
  const shown = (n: number | null, unit: string) => (n === null ? "Đang tải…" : `${n} ${unit}`);

  return (
    <div>
      <h1 className="text-3xl font-light tracking-tight">Xin chào{user.displayName ? `, ${user.displayName}` : ""}</h1>
      <p className="mt-1 text-muted">Việc cần xử lý hôm nay.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {canOpen(user.roles, "/admin/bao-gia") ? <Tile href="/admin/bao-gia" title="Báo giá" value={shown(count(quotes.data, ["new"]), "yêu cầu mới")} note="Liên hệ trong 1 ngày làm việc" /> : null}
        {canOpen(user.roles, "/admin/don-hang") ? <Tile href="/admin/don-hang" title="Đơn hàng" value={shown(count(orders.data, ["paid", "pending_payment", "packing"]), "đơn cần xử lý")} note="Đã thanh toán, chờ thanh toán hoặc đang đóng gói" /> : null}
        {canOpen(user.roles, "/admin/bai-viet") ? <Tile href="/admin/bai-viet" title="Bài viết" value={shown(count(articles.data, ["draft"]), "bản nháp")} note="Viết bài bằng skill R&D, duyệt đăng tại đây" /> : null}
        {canOpen(user.roles, "/admin/san-pham") ? <Tile href="/admin/san-pham" title="Sản phẩm & combo" value="Quản lý" note="Giá, tồn kho, ảnh, thành phần combo" /> : null}
        {canOpen(user.roles, "/admin/khoa-hoc") ? <Tile href="/admin/khoa-hoc" title="Khóa học" value="Lịch học" note="Mở lớp, xác nhận học viên" /> : null}
      </div>
    </div>
  );
}
