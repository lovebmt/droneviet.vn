"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_SECTIONS } from "./sections";

export function AdminNav({ roles }: { roles: readonly string[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Quản trị" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ADMIN_SECTIONS.filter((s) => s.roles.some((r) => roles.includes(r))).map((s) => {
        const active = s.href === "/admin" ? pathname === "/admin" : pathname.startsWith(s.href);
        return (
          <Link key={s.href} href={s.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm ${active ? "bg-sky-50 font-semibold text-sky" : "hover:bg-sky-50"}`}>
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
