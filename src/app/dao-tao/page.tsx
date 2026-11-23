import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CourseCard } from "@/components/education/course-card";
import { EmptyState } from "@/components/page/empty-state";
import { PageHeader } from "@/components/page/page-header";
import { Section } from "@/components/ui/section";
import { listCourses } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Đào tạo & chứng chỉ",
  description: "Khóa học drone cho học sinh, giáo viên và người mới bắt đầu, cùng lộ trình lấy chứng chỉ điều khiển.",
  alternates: { canonical: "/dao-tao" },
};

export default async function TrainingPage() {
  // Workshops belong to Giáo dục (/giao-duc/workshop).
  const courses = (await listCourses()).filter((c) => c.level !== "workshop");
  return (
    <>
      <PageHeader
        title="Đào tạo & chứng chỉ"
        lead="Khóa học drone cho học sinh, giáo viên và người mới bắt đầu. Giữ chỗ online, Drone Việt gọi xác nhận."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Đào tạo" }]}
      />
      <Section>
        <h2 className="text-3xl font-light tracking-tight">Khóa học</h2>
        {courses.length ? (
          <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => <li key={c.slug} className="flex [&>a]:flex-1"><CourseCard course={c} /></li>)}
          </ul>
        ) : (
          <div className="mt-8"><EmptyState title="Lịch khóa học đang cập nhật">Nhắn Zalo để được báo khi có lớp mới.</EmptyState></div>
        )}
      </Section>
      <Section tone="sky">
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/dao-tao/chung-chi" className="group rounded-2xl bg-white p-8">
            <p className="text-sm text-muted">Lộ trình</p>
            <p className="mt-1 text-2xl font-semibold">Hướng dẫn lấy chứng chỉ</p>
            <p className="mt-2 text-muted">Các bước từ lý thuyết an toàn đến thi thực hành.</p>
            <span className="mt-4 inline-flex items-center gap-0.5 font-semibold text-sky-ink group-hover:underline underline-offset-4">Xem lộ trình <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" /></span>
          </Link>
          <Link href="/bay-mo-phong" className="group rounded-2xl bg-sun p-8 text-ink">
            <p className="text-sm">Luyện tập miễn phí</p>
            <p className="mt-1 text-2xl font-semibold">Bay mô phỏng trên trình duyệt</p>
            <p className="mt-2">Tập điều khiển trước khi bay thật, không cần cài đặt.</p>
            <span className="mt-4 inline-flex items-center gap-0.5 font-semibold group-hover:underline underline-offset-4">Bay thử ngay <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" /></span>
          </Link>
        </div>
      </Section>
    </>
  );
}
