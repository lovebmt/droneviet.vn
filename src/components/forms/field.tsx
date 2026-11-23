import type { ComponentProps, ReactNode } from "react";

const control =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";

/** Label + control + optional hint; required fields are marked in words, not just colour. */
export function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">
        {label}
        {required ? <span className="font-normal text-muted"> (bắt buộc)</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </p>
  );
}
