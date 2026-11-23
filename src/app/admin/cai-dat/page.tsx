"use client";

import type { FormEvent } from "react";
import { Field, Input } from "@/components/forms/field";
import { Panel, SaveStatus } from "@/components/admin/admin-ui";
import { useSave } from "@/components/admin/save-state";
import { useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import type { PublicSettings } from "@/lib/api/types";

const CONTACT = [
  { key: "zalo", label: "Zalo", hint: "Số điện thoại Zalo, không dấu cách" },
  { key: "phone", label: "Điện thoại" },
  { key: "email", label: "Email" },
  { key: "address", label: "Địa chỉ" },
  { key: "companyName", label: "Tên công ty" },
] as const;

const text = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v || null;
};

export default function AdminSettingsPage() {
  const { data, error, reload } = useAdminData<PublicSettings>("/settings/public");
  const contact = useSave();
  const announcement = useSave();

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    if (await contact.run("/admin/settings/contact", "PATCH", { value: Object.fromEntries(CONTACT.map((c) => [c.key, text(f, c.key)])) })) reload();
  }

  async function saveAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const t = text(f, "text");
    if (await announcement.run("/admin/settings/announcement", "PATCH", { value: t ? { text: t, href: text(f, "href") } : null })) reload();
  }

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p className="text-muted">Đang tải…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-light tracking-tight">Cài đặt</h1>
      <p className="text-muted">Thay đổi hiện trên website trong vài giây, không cần deploy. Để trống thì website hiện “Đang cập nhật”.</p>
      <form onSubmit={saveContact}>
        <Panel title="Liên hệ">
          <div className="grid gap-4 sm:grid-cols-2">
            {CONTACT.map((c) => (
              <Field key={c.key} label={c.label} hint={"hint" in c ? c.hint : undefined}>
                <Input name={c.key} defaultValue={data.contact[c.key] ?? ""} />
              </Field>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={contact.state === "saving"}>Lưu liên hệ</Button>
            <SaveStatus state={contact.state} error={contact.error} />
          </div>
        </Panel>
      </form>
      <form onSubmit={saveAnnouncement}>
        <Panel title="Thông báo đầu trang">
          <div className="grid gap-4">
            <Field label="Nội dung" hint="Để trống để tắt thông báo"><Input name="text" defaultValue={data.announcement?.text ?? ""} /></Field>
            <Field label="Link khi bấm vào" hint="Ví dụ /cua-hang/combo/combo-lop-hoc-quoc-te"><Input name="href" defaultValue={data.announcement?.href ?? ""} /></Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={announcement.state === "saving"}>Lưu thông báo</Button>
            <SaveStatus state={announcement.state} error={announcement.error} />
          </div>
        </Panel>
      </form>
    </div>
  );
}
