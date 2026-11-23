import Link from "next/link";
import type { ReactNode } from "react";

/** EN pages share the Vietnamese chrome; this marks their content as English and links back. */
export function EnShell({ children, viHref }: { children: ReactNode; viHref: string }) {
  return (
    <div lang="en">
      <div className="border-b border-line bg-sky-50">
        <div className="mx-auto flex max-w-7xl justify-end px-5 py-2 text-sm sm:px-8">
          <Link href={viHref} lang="vi" hrefLang="vi" className="font-semibold text-sky hover:underline underline-offset-4">Xem bằng tiếng Việt</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
