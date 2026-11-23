"use client";
/* eslint-disable @next/next/no-img-element -- previews of arbitrary uploaded media */

import { Copy, FileText } from "lucide-react";
import { useState } from "react";
import { MediaUpload } from "@/components/admin/image-upload";
import { useAdminData } from "@/components/admin/use-admin-data";
import { formatDate } from "@/lib/format";

type Item = { id: string; url: string; filename: string; mime: string; bytes: number; alt: string | null; source: string | null; createdAt: string };

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => void navigator.clipboard?.writeText(value).then(() => setDone(true))} className="inline-flex items-center gap-1 text-sm font-semibold text-sky">
      <Copy size={14} strokeWidth={1.75} aria-hidden="true" /> {done ? "Đã chép" : "Chép link"}
    </button>
  );
}

export default function AdminMediaPage() {
  const { data, error, reload } = useAdminData<Item[]>("/admin/media");
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-light tracking-tight">Media</h1>
        <div className="flex gap-2">
          <MediaUpload label="Tải ảnh lên" onUploaded={reload} />
          <MediaUpload label="Tải PDF lên" accept="application/pdf" onUploaded={reload} />
        </div>
      </div>
      <p className="mt-1 text-muted">Ảnh WebP, AVIF, PNG, JPEG, SVG hoặc PDF, tối đa 4 MB. Dùng link để chèn vào sản phẩm hoặc bài viết.</p>
      {error ? <p role="alert" className="mt-6">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-muted">Đang tải…</p> : null}
      {data ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <li key={m.id} className="rounded-2xl border border-line p-3">
              {m.mime.startsWith("image/") ? (
                <img src={m.url} alt={m.alt ?? ""} className="aspect-[4/3] w-full rounded-xl bg-sky-50 object-cover" loading="lazy" />
              ) : (
                <span className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-sky-50"><FileText size={36} strokeWidth={1.5} className="text-muted" aria-hidden="true" /></span>
              )}
              <p className="mt-2 truncate text-sm font-semibold">{m.filename}</p>
              <p className="text-xs text-muted">{Math.round(m.bytes / 1024)} KB, {formatDate(m.createdAt)}</p>
              <input readOnly value={m.url} aria-label={`Link ${m.filename}`} onFocus={(e) => e.target.select()} className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-xs" />
              <div className="mt-2"><CopyButton value={m.url} /></div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
