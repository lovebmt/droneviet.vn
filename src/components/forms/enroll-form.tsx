"use client";

import { CheckCircle2, MessageCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { CourseDetail } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { Field, FormError, Input, Textarea } from "./field";

const time = (iso: string) => new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
/** Workshops: "Thứ Bảy, 12/12/2026" and "9:00". */
const weekday = (iso: string) => new Intl.DateTimeFormat("vi-VN", { weekday: "long", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
const clock = (iso: string) => new Intl.DateTimeFormat("vi-VN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));

/**
 * Reserves a seat; staff confirm by phone (no online payment for courses, spec §16 Q5).
 * `group` (workshops): asks for the school, group size and a note, and offers the Zalo group afterwards.
 */
export function EnrollForm({ course, group = false }: { course: Pick<CourseDetail, "slug" | "sessions">; group?: boolean }) {
  const { user } = useSession();
  const firstOpen = course.sessions.find((s) => s.seatsLeft > 0)?.id ?? null;
  const [sessionId, setSessionId] = useState<string | null>(firstOpen);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [zaloGroupUrl, setZaloGroupUrl] = useState<string | null>(null);

  if (!course.sessions.length) {
    return <p className="rounded-2xl bg-sky-50 p-5 text-muted">Lịch khai giảng đang cập nhật. Để lại thông tin ở trang Báo giá hoặc nhắn Zalo để được báo lịch sớm nhất.</p>;
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl bg-sky-50 p-6">
        <CheckCircle2 size={28} strokeWidth={1.75} className="text-teal-ink" aria-hidden="true" />
        <p className="mt-2 text-lg font-semibold">{group ? "Đã nhận đăng ký" : "Đã giữ chỗ"}</p>
        <p className="mt-1 text-muted">{group ? "Drone Việt sẽ gọi xác nhận thời gian và địa điểm." : "Drone Việt sẽ gọi xác nhận và hướng dẫn đóng học phí."}</p>
        {zaloGroupUrl ? (
          <LinkButton href={zaloGroupUrl} variant="secondary" className="mt-4" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /> Vào nhóm Zalo workshop
          </LinkButton>
        ) : null}
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
      const groupFields = group
        ? { organization: text("organization") || undefined, quantity: Number(text("quantity")) || 1, note: text("note") || undefined }
        : {};
      const result = await apiFetch<{ zaloGroupUrl?: string | null }>(`/courses/${encodeURIComponent(course.slug)}/enroll`, {
        method: "POST",
        body: JSON.stringify({ sessionId, name: text("name"), phone: text("phone"), email: text("email") || undefined, ...groupFields }),
      });
      setZaloGroupUrl(result?.zaloGroupUrl ?? null);
      setState("sent");
    } catch (e) {
      setState("idle");
      setError(
        e instanceof ApiError && e.status === 409
          ? group
            ? "Buổi này không còn đủ chỗ cho số người bạn đăng ký. Chọn buổi khác hoặc nhắn Zalo."
            : "Lịch học này vừa đủ chỗ. Chọn lịch khác hoặc nhắn Zalo để được báo lịch mới."
          : e instanceof ApiError && e.status === 400
            ? "Kiểm tra lại họ tên và số điện thoại (ví dụ 0912345678)."
            : "Chưa giữ chỗ được. Thử lại sau ít phút.",
      );
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div role="radiogroup" aria-label={group ? "Chọn buổi workshop" : "Chọn lịch học"} className="space-y-2">
        {course.sessions.map((s) => {
          const full = s.seatsLeft <= 0;
          return (
            <label key={s.id} className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${full ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${sessionId === s.id ? "border-sky bg-sky-50" : "border-line"}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="session" value={s.id} disabled={full} checked={sessionId === s.id} onChange={() => setSessionId(s.id)} className="accent-[#0B6FE0]" />
                <span>
                  <span className="block font-semibold">{group ? `${weekday(s.startsAt)}, ${formatDate(s.startsAt)}` : `Khai giảng ${formatDate(s.startsAt)}`}</span>
                  <span className="block text-sm text-muted">{group ? clock(s.startsAt) : time(s.startsAt)}</span>
                </span>
              </span>
              <span className={`text-sm font-semibold ${full ? "text-muted" : "text-ink"}`}>{full ? "Đã đủ chỗ" : `Còn ${s.seatsLeft} chỗ`}</span>
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
        {group ? (
          <>
            <Field label="Trường hoặc đơn vị">
              <Input name="organization" maxLength={200} autoComplete="organization" />
            </Field>
            <Field label="Số người tham gia">
              <Input name="quantity" type="number" min={1} max={200} defaultValue={1} inputMode="numeric" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Ghi chú">
                <Textarea name="note" rows={3} maxLength={1000} placeholder="Lớp, độ tuổi, thời gian mong muốn…" />
              </Field>
            </div>
          </>
        ) : null}
      </div>
      <FormError message={error} />
      <Button type="submit" size="lg" disabled={!sessionId || state === "sending"}>
        {state === "sending" ? (group ? "Đang gửi…" : "Đang giữ chỗ…") : group ? "Đăng ký" : "Giữ chỗ"}
      </Button>
    </form>
  );
}
