import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Be Vietnam Pro (SIL OFL 1.1, assets/fonts/OFL.txt): needed for Vietnamese diacritics in generated images. */
export async function brandFonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [regular, semibold] = await Promise.all([readFile(join(dir, "BeVietnamPro-Regular.ttf")), readFile(join(dir, "BeVietnamPro-SemiBold.ttf"))]);
  return [
    { name: "Be Vietnam Pro", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Be Vietnam Pro", data: semibold, weight: 600 as const, style: "normal" as const },
  ];
}

/** The quadcopter mark from the site logo. */
export function DroneMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26">
      <g fill="none" stroke={color} strokeWidth="1.75">
        <circle cx="6" cy="6" r="4" />
        <circle cx="20" cy="6" r="4" />
        <circle cx="6" cy="20" r="4" />
        <circle cx="20" cy="20" r="4" />
        <path d="M9 9l8 8M17 9l-8 8" strokeLinecap="round" />
      </g>
      <rect x="10.5" y="10.5" width="5" height="5" rx="1.5" fill={color} />
    </svg>
  );
}
