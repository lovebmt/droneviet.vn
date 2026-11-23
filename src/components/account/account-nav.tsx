"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/tai-khoan", label: "Tổng quan" },
  { href: "/tai-khoan/don-hang", label: "Đơn hàng" },
  { href: "/tai-khoan/khoa-hoc", label: "Khóa học" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Tài khoản" className="flex gap-2 overflow-x-auto lg:flex-col">
      {ITEMS.map((item) => {
        const active = item.href === "/tai-khoan" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm lg:rounded-xl ${active ? "bg-sky-50 font-semibold text-sky" : "hover:bg-sky-50"}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
