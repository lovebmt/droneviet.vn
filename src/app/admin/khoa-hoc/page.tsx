"use client";

import { type FormEvent, useState } from "react";
import { Field, Input } from "@/components/forms/field";
import { Panel, SaveStatus } from "@/components/admin/admin-ui";
import { useSave } from "@/components/admin/save-state";
import { adminError, useAdminData } from "@/components/admin/use-admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

type Session = { id: string; startsAt: string; capacity: number; reservedSeats: number; status: "open" | "closed"; enrollments: number };
type Course = { id: string; slug: string; title: string; sessions: Session[] };
type Enrollment = { id: string; contactName: string; contactPhone: string; contactEmail: string | null; status: string; quantity: number };

const ENROLL: Record<string, string> = { reserved: "Giữ chỗ", confirmed: "Đã xác nhận", cancelled: "Đã hủy" };
const time = (iso: string) => new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));

function Enrollments({ sessionId, onChanged }: { sessionId: string; onChanged(): void }) {
  const { data, error, reload } = useAdminData<Enrollment[]>(`/admin/course-sessions/${sessionId}/enrollments`);
  const [failure, setFailure] = useState<string | null>(null);
  async function set(e: Enrollment, status: string) {
    setFailure(null);
    try {
      await apiFetch(`/admin/enrollments/${e.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      reload();
      onChanged();
    } catch (err) {
      setFailure(adminError(err));
    }
  }
  if (error) return <p role="alert" className="text-sm">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Đang tải…</p>;
  if (!data.length) return <p className="text-sm text-muted">Chưa có học viên.</p>;
  return (
    <div>
      <ul className="divide-y divide-line text-sm">
        {data.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
            <span><span className="font-semibold">{e.contactName}</span>, <a href={`tel:${e.contactPhone}`} className="text-sky-ink">{e.contactPhone}</a>{e.contactEmail ? `, ${e.contactEmail}` : ""}</span>
            <span className="flex items-center gap-2">
              <Badge tone={e.status === "confirmed" ? "teal" : "neutral"}>{ENROLL[e.status] ?? e.status}</Badge>
              {e.status === "reserved" ? <Button type="button" variant="secondary" onClick={() => void set(e, "confirmed")} aria-label={`Xác nhận ${e.contactName}`}>Xác nhận</Button> : null}
              {e.status !== "cancelled" ? <Button type="button" variant="ghost" onClick={() => window.confirm(`Hủy chỗ của ${e.contactName}?`) && void set(e, "cancelled")} aria-label={`Hủy ${e.contactName}`}>Hủy</Button> : null}
            </span>
          </li>
        ))}
      </ul>
      {failure ? <p role="alert" className="text-sm text-red-800">{failure}</p> : null}
    </div>
  );
}

function SessionRow({ session, onChanged }: { session: Session; onChanged(): void }) {
  const [open, setOpen] = useState(false);
  const save = useSave();
  return (
    <li className="rounded-xl bg-sky-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Khai giảng {formatDate(session.startsAt)}, {time(session.startsAt)}</p>
          <p className="text-sm text-muted">{session.reservedSeats}/{session.capacity} chỗ, {session.enrollments} học viên</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={session.status === "open" ? "teal" : "neutral"}>{session.status === "open" ? "Đang nhận" : "Đã đóng"}</Badge>
          <Button type="button" variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Ẩn học viên" : `Xem học viên (${session.enrollments})`}</Button>
          <Button type="button" variant="secondary" onClick={() => void save.run(`/admin/course-sessions/${session.id}`, "PATCH", { status: session.status === "open" ? "closed" : "open" }).then((ok) => ok && onChanged())}>
            {session.status === "open" ? "Đóng đăng ký" : "Mở lại"}
          </Button>
        </div>
      </div>
      <SaveStatus state="idle" error={save.error} />
      {open ? <div className="mt-3 rounded-xl bg-white p-3"><Enrollments sessionId={session.id} onChanged={onChanged} /></div> : null}
    </li>
  );
}

function CoursePanel({ course, onChanged }: { course: Course; onChanged(): void }) {
  const save = useSave();
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const f = new FormData(form);
    const local = String(f.get("startsAt"));
    const ok = await save.run(`/admin/courses/${course.slug}/sessions`, "POST", {
      // The form is in Vietnam time whatever the staff member's computer is set to.
      startsAt: new Date(`${local}:00+07:00`).toISOString(),
      capacity: Number(f.get("capacity")),
    });
    if (ok) {
      form.reset();
      onChanged();
    }
  }
  return (
    <Panel title={course.title}>
      {course.sessions.length ? <ul className="space-y-2">{course.sessions.map((s) => <SessionRow key={s.id} session={s} onChanged={onChanged} />)}</ul> : <p className="text-sm text-muted">Chưa có lịch học.</p>}
      <form onSubmit={add} className="mt-5 grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
        <Field label="Ngày giờ khai giảng"><Input name="startsAt" type="datetime-local" required /></Field>
        <Field label="Số chỗ"><Input name="capacity" type="number" min={1} max={500} required defaultValue={20} /></Field>
        <Button type="submit" disabled={save.state === "saving"}>Mở lịch học</Button>
      </form>
      <div className="mt-2"><SaveStatus state={save.state} error={save.error} /></div>
    </Panel>
  );
}

export default function AdminCoursesPage() {
  const { data, error, reload } = useAdminData<Course[]>("/admin/courses");
  return (
    <div>
      <h1 className="text-3xl font-light tracking-tight">Khóa học</h1>
      <p className="mt-1 text-muted">Giờ hiển thị và nhập theo giờ Việt Nam.</p>
      {error ? <p role="alert" className="mt-6">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-muted">Đang tải…</p> : null}
      <div className="mt-6 space-y-4">{data?.map((c) => <CoursePanel key={c.id} course={c} onChanged={reload} />)}</div>
    </div>
  );
}
