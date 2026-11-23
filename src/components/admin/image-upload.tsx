"use client";

import { Upload } from "lucide-react";
import { useId, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { adminError } from "./use-admin-data";

const MAX_BYTES = 4 * 1024 * 1024;

export type Uploaded = { id: string; url: string; mime: string; bytes: number };

/** Uploads one file to /admin/media (≤4MB; images or PDF) and hands back its public URL. */
export function MediaUpload({ label, accept = "image/webp,image/avif,image/png,image/jpeg,image/svg+xml", alt, onUploaded }: { label: string; accept?: string; alt?: string; onUploaded(file: Uploaded): void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("Tệp lớn hơn 4 MB. Nén ảnh (WebP) rồi thử lại.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    if (alt) form.append("alt", alt);
    setBusy(true);
    try {
      onUploaded(await apiFetch<Uploaded>("/admin/media", { method: "POST", body: form }));
    } catch (e) {
      setError(adminError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky">
        <Upload size={16} strokeWidth={1.75} aria-hidden="true" /> {busy ? "Đang tải lên…" : label}
        <input id={id} type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      </label>
      {error ? <p role="alert" className="mt-2 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
