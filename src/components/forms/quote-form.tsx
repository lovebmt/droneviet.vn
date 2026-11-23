"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api/client";
import { Field, FormError, Input, Select, Textarea } from "./field";

const ORG_TYPES = [
  { value: "school", label: "Trường phổ thông" },
  { value: "center", label: "Trung tâm STEM" },
  { value: "university", label: "Trường đại học, cao đẳng" },
  { value: "company", label: "Doanh nghiệp" },
  { value: "other", label: "Khác" },
];

export function QuoteForm({ productSlug, students }: { productSlug: string | null; students: number | null }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const studentsValue = Number(text("students"));
    setState("sending");
    setError(null);
    try {
      await apiFetch("/quotes", {
        method: "POST",
        body: JSON.stringify({
          organization: text("organization"),
          organizationType: text("organizationType") || undefined,
          contactName: text("contactName"),
          phone: text("phone"),
          email: text("email") || undefined,
          students: studentsValue > 0 ? studentsValue : undefined,
          quantity: Math.max(1, Number(text("quantity")) || 1),
          productSlug: productSlug ?? undefined,
          requirements: text("requirements") || undefined,
        }),
      });
      setState("sent");
    } catch (e) {
      setState("idle");
      setError(
        e instanceof ApiError && e.status === 400
          ? "Thông tin chưa hợp lệ. Kiểm tra lại số điện thoại (ví dụ 0912345678) và email."
          : "Chưa gửi được yêu cầu. Thử lại sau ít phút hoặc nhắn Zalo cho Drone Việt.",
      );
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl bg-sky-50 p-8">
        <CheckCircle2 size={32} strokeWidth={1.75} className="text-teal-ink" aria-hidden="true" />
        <h2 className="mt-3 text-2xl font-semibold">Đã gửi yêu cầu báo giá</h2>
        <p className="mt-2 text-muted">Drone Việt sẽ liên hệ trong 1 ngày làm việc qua số điện thoại bạn để lại.</p>
        <Link href="/cua-hang" className="mt-6 inline-block font-semibold text-sky underline underline-offset-4">Tiếp tục xem sản phẩm</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Tên trường hoặc đơn vị" required>
          <Input name="organization" required autoComplete="organization" placeholder="Ví dụ: Trường THCS Nguyễn Du" />
        </Field>
      </div>
      <Field label="Loại đơn vị">
        <Select name="organizationType" defaultValue="school">
          {ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </Field>
      <Field label="Người liên hệ" required>
        <Input name="contactName" required autoComplete="name" />
      </Field>
      <Field label="Số điện thoại" required>
        <Input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="0912345678" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" />
      </Field>
      <Field label="Số học sinh" hint="Ước lượng cũng được">
        <Input name="students" type="number" min={1} defaultValue={students ?? undefined} inputMode="numeric" />
      </Field>
      <Field label="Số lớp hoặc số bộ">
        <Input name="quantity" type="number" min={1} defaultValue={1} inputMode="numeric" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Nhu cầu của trường">
          <Textarea name="requirements" rows={4} placeholder="Cấp học, thời gian triển khai, ngân sách dự kiến, yêu cầu đào tạo giáo viên…" />
        </Field>
      </div>
      <div className="space-y-4 sm:col-span-2">
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={state === "sending"}>
          {state === "sending" ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
        </Button>
        <p className="text-sm text-muted">
          Thông tin chỉ dùng để tư vấn, xem <Link href="/chinh-sach-bao-mat" className="underline underline-offset-4">chính sách bảo mật</Link>.
        </p>
      </div>
    </form>
  );
}
