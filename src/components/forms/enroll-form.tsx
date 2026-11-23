"use client";

import { CheckCircle2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { CourseDetail } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { Field, FormError, Input } from "./field";

const time = (iso: string) => new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));

/** Reserves a seat; staff confirm by phone (no online payment for courses, spec §16 Q5). */
export function EnrollForm({ course }: { course: Pick<CourseDetail, "slug" | "sessions"> }) {
  const { user } = useSession();
  const firstOpen = course.sessions.find((s) => s.seatsLeft > 0)?.id ?? null;
  const [sessionId, setSessionId] = useState<string | null>(firstOpen);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!course.sessions.length) {
    return <p className="rounded-2xl bg-sky-50 p-5 text-muted">Lịch khai giảng đang cập nhật. Để lại thông tin ở trang Báo giá hoặc nhắn Zalo để được báo lịch sớm nhất.</p>;
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl bg-sky-50 p-6">
        <CheckCircle2 size={28} strokeWidth={1.75} className="text-teal-ink" aria-hidden="true" />
        <p className="mt-2 text-lg font-semibold">Đã giữ chỗ</p>
        <p className="mt-1 text-muted">Drone Việt sẽ gọi xác nhận và hướng dẫn đóng học phí.</p>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionId) return;
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    setState("sending");
    setError(null);
    try {
      await apiFetch(`/courses/${encodeURIComponent(course.slug)}/enroll`, {
        method: "POST",
        body: JSON.stringify({ sessionId, name: text("name"), phone: text("phone"), email: text("email") || undefined }),
      });
      setState("sent");
    } catch (e) {
      setState("idle");
      setError(
        e instanceof ApiError && e.status === 409
          ? "Lịch học này vừa đủ chỗ. Chọn lịch khác hoặc nhắn Zalo để được báo lịch mới."
          : e instanceof ApiError && e.status === 400
            ? "Kiểm tra lại họ tên và số điện thoại (ví dụ 0912345678)."
            : "Chưa giữ chỗ được. Thử lại sau ít phút.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div role="radiogroup" aria-label="Chọn lịch học" className="space-y-2">
        {course.sessions.map((s) => {
          const full = s.seatsLeft <= 0;
          return (
            <label key={s.id} className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${full ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${sessionId === s.id ? "border-sky bg-sky-50" : "border-line"}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="session" value={s.id} disabled={full} checked={sessionId === s.id} onChange={() => setSessionId(s.id)} className="accent-[#0B6FE0]" />
                <span>
                  <span className="block font-semibold">Khai giảng {formatDate(s.startsAt)}</span>
                  <span className="block text-sm text-muted">{time(s.startsAt)}</span>
                </span>
              </span>
              <span className={`text-sm font-semibold ${full ? "text-muted" : "text-teal-ink"}`}>{full ? "Đã đủ chỗ" : `Còn ${s.seatsLeft} chỗ`}</span>
            </label>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Họ và tên" required>
          <Input name="name" required minLength={2} autoComplete="name" defaultValue={user?.displayName ?? ""} />
        </Field>
        <Field label="Số điện thoại" required>
          <Input name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" defaultValue={user?.email ?? ""} />
          </Field>
        </div>
      </div>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={!sessionId || state === "sending"}>
        {state === "sending" ? "Đang giữ chỗ…" : "Giữ chỗ"}
      </Button>
    </form>
  );
}
