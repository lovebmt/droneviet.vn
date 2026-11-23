import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, Clock, MapPin } from "lucide-react";
import { Markdown } from "@/components/content/markdown";
import { EnrollForm } from "@/components/forms/enroll-form";
import { Breadcrumbs } from "@/components/page/breadcrumbs";
import { Container } from "@/components/ui/container";
import { COURSE_FORMAT, COURSE_LEVEL } from "@/content/training";
import { getCourse } from "@/lib/api/server";
import { formatVnd } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return { title: "Không tìm thấy khóa học" };
  return { title: course.title, description: course.summary, alternates: { canonical: `/dao-tao/${course.slug}` } };
}

export default async function CoursePage({ params }: Props) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Trang chủ", href: "/" }, { label: "Đào tạo", href: "/dao-tao" }, { label: course.title }]} />
      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_26rem]">
        <div>
          <p className="text-sm font-semibold text-teal-ink">{COURSE_LEVEL[course.level] ?? course.level}</p>
          <h1 className="mt-2 text-4xl font-light tracking-tight sm:text-5xl">{course.title}</h1>
          <p className="mt-4 text-lg text-muted">{course.summary}</p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {course.durationHours ? <li className="flex items-center gap-2"><Clock size={18} strokeWidth={1.75} aria-hidden="true" /> {course.durationHours} giờ học</li> : null}
            <li className="flex items-center gap-2"><MapPin size={18} strokeWidth={1.75} aria-hidden="true" /> {COURSE_FORMAT[course.format] ?? course.format}</li>
            {course.certificateTrack ? <li className="flex items-center gap-2"><Award size={18} strokeWidth={1.75} aria-hidden="true" /> Có lộ trình chứng chỉ</li> : null}
          </ul>
          {course.descriptionMarkdown ? <div className="mt-10"><Markdown source={course.descriptionMarkdown} /></div> : null}
        </div>
        <aside className="h-fit rounded-2xl border border-line p-6">
          <p className="text-sm text-muted">Học phí</p>
          <p className="text-3xl font-semibold">{course.tuitionVnd === null ? "Liên hệ" : formatVnd(course.tuitionVnd)}</p>
          <h2 className="mt-6 text-lg font-semibold">Giữ chỗ</h2>
          <div className="mt-4"><EnrollForm course={course} /></div>
        </aside>
      </div>
    </Container>
  );
}
