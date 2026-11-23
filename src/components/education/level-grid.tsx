import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LEVELS } from "@/content/levels";

/** The four school levels as coloured tiles; teal gets ink text (never white on teal). */
export function LevelGrid({ exclude }: { exclude?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {LEVELS.filter((l) => l.slug !== exclude).map((level) => (
        <Link key={level.slug} href={`/giao-duc/${level.slug}`} className={`group flex min-h-[180px] flex-col justify-between rounded-2xl p-6 ${level.tone} ${level.tone === "bg-teal" ? "text-ink" : "text-white"}`}>
          <span className="text-2xl font-semibold">{level.name}</span>
          <span>
            <span className="block opacity-90">{level.short}</span>
            <span className="mt-3 inline-flex items-center gap-0.5 font-semibold group-hover:underline underline-offset-4">
              Tìm hiểu <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
