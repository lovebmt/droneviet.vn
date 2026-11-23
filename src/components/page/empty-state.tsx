import type { ReactNode } from "react";

/** An empty list is an invitation to act, not an apology. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children ? <div className="mt-3 text-muted">{children}</div> : null}
    </div>
  );
}
