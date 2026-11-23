import Link from "next/link";
import { Clock, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { COURSE_FORMAT, COURSE_LEVEL } from "@/content/training";
import type { CourseCard as Course } from "@/lib/api/types";
import { formatDate, formatVnd } from "@/lib/format";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/dao-tao/${course.slug}`} className="group flex flex-col rounded-2xl border border-line p-6 hover:border-sky">
      <div className="flex flex-wrap gap-2">
        <Badge tone="sky">{COURSE_LEVEL[course.level] ?? course.level}</Badge>
        <Badge>{COURSE_FORMAT[course.format] ?? course.format}</Badge>
      </div>
      <h3 className="mt-4 text-xl font-semibold group-hover:text-sky">{course.title}</h3>
      <p className="mt-2 text-muted">{course.summary}</p>
      <ul className="mt-4 space-y-1 text-sm text-muted">
        {course.durationHours ? <li className="flex items-center gap-2"><Clock size={16} strokeWidth={1.75} aria-hidden="true" /> {course.durationHours} giờ học</li> : null}
        {course.certificateTrack ? <li className="flex items-center gap-2"><Award size={16} strokeWidth={1.75} aria-hidden="true" /> Có lộ trình chứng chỉ</li> : null}
      </ul>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <span className="font-semibold">{course.tuitionVnd === null ? "Liên hệ" : formatVnd(course.tuitionVnd)}</span>
        <span className="text-sm text-muted">{course.nextSessionAt ? `Khai giảng ${formatDate(course.nextSessionAt)}` : "Lịch đang cập nhật"}</span>
      </div>
    </Link>
  );
}
