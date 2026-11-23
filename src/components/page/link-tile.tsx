import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Text-only tile in the DJI grid (comparison, parts, certificate path). */
export function LinkTile({ href, context, title, text, tone = "sky" }: { href: string; context: string; title: string; text: string; tone?: "sky" | "line" }) {
  return (
    <Link href={href} className={`group flex min-h-[220px] flex-col items-center justify-center rounded-2xl px-6 py-10 text-center ${tone === "sky" ? "bg-sky-50" : "border border-line bg-white"}`}>
      <span className="text-sm text-muted">{context}</span>
      <span className="mt-2 text-3xl font-light tracking-tight">{title}</span>
      <span className="mt-2 font-semibold">{text}</span>
      <span className="mt-4 inline-flex items-center gap-0.5 text-[15px] font-medium text-sky-ink group-hover:underline underline-offset-4">
        Xem <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
    </Link>
  );
}
