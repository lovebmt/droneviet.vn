import Link from "next/link";

/** Wordmark with a small top-down quadcopter mark (four rotors around a body). */
export function Logo({ tone = "ink" }: { tone?: "ink" | "white" }) {
  const color = tone === "white" ? "text-white" : "text-ink";
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-bold tracking-tight ${color}`} aria-label="Drone Việt, trang chủ">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="text-sky-ink">
        <g fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="6" cy="6" r="4" /><circle cx="20" cy="6" r="4" /><circle cx="6" cy="20" r="4" /><circle cx="20" cy="20" r="4" />
          <path d="M9 9l8 8M17 9l-8 8" strokeLinecap="round" />
        </g>
        <rect x="10.5" y="10.5" width="5" height="5" rx="1.5" fill="currentColor" />
      </svg>
      <span className="whitespace-nowrap text-[17px]">Drone Việt</span>
    </Link>
  );
}
