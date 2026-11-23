import type { ReactNode } from "react";

export function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-line p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SaveStatus({ state, error }: { state: "idle" | "saving" | "saved"; error: string | null }) {
  if (error) return <p role="alert" className="text-sm text-red-800">{error}</p>;
  if (state === "saved") return <p role="status" className="text-sm font-semibold text-teal-ink">Đã lưu</p>;
  return null;
}
