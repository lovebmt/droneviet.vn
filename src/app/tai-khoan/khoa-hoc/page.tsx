"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireSession } from "@/components/account/require-session";
import { EmptyState } from "@/components/page/empty-state";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

type Enrollment = { id: string; status: string; quantity: number; session: { id: string; startsAt: string }; course: { slug: string; title: string } };
const STATUS: Record<string, string> = { reserved: "Đã giữ chỗ", confirmed: "Đã xác nhận", cancelled: "Đã hủy", completed: "Đã hoàn thành" };

function Courses() {
  const [items, setItems] = useState<Enrollment[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    apiFetch<Enrollment[]>("/me/courses").then(setItems, () => setFailed(true));
  }, []);
  if (failed) return <p role="alert">Chưa tải được khóa học. Thử tải lại trang.</p>;
  if (!items) return <p className="text-muted">Đang tải…</p>;
  if (!items.length) return <EmptyState title="Bạn chưa đăng ký khóa học nào"><Link href="/dao-tao" className="font-semibold text-sky-ink underline underline-offset-4">Xem khóa học</Link></EmptyState>;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <Link href={`/dao-tao/${e.course.slug}`} className="font-semibold hover:text-sky-ink">{e.course.title}</Link>
            <p className="text-sm text-muted">Khai giảng {formatDate(e.session.startsAt)}</p>
          </div>
          <Badge tone="sky">{STATUS[e.status] ?? e.status}</Badge>
        </li>
      ))}
    </ul>
  );
}

export default function MyCoursesPage() {
  return (
    <div>
      <h1 className="text-4xl font-light tracking-tight">Khóa học của tôi</h1>
      <div className="mt-6"><RequireSession>{() => <Courses />}</RequireSession></div>
    </div>
  );
}
