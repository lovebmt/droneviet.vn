import type { ReactNode } from "react";

type Tone = "teal" | "sun" | "sky" | "neutral";

/** Teal and sun are bright: text is always ink, never white (spec §7.1). */
const TONES: Record<Tone, string> = {
  teal: "bg-teal text-ink",
  sun: "bg-sun text-ink",
  sky: "bg-sky-50 text-sky",
  neutral: "bg-white text-ink ring-1 ring-line",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}
