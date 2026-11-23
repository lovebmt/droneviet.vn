"use client";

import Link from "next/link";
import { BookOpen, LayoutDashboard, Package, ShoppingBag } from "lucide-react";
import { RequireSession } from "@/components/account/require-session";
import { isStaff } from "@/components/admin/sections";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const { logout } = useSession();
  return (
    <RequireSession>
      {(user) => (
        <div>
          <h1 className="text-4xl font-light tracking-tight">Xin chào{user.displayName ? `, ${user.displayName}` : ""}</h1>
          <p className="mt-2 text-muted">{user.email}</p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { href: "/tai-khoan/don-hang", label: "Đơn hàng của tôi", Icon: Package },
              { href: "/tai-khoan/khoa-hoc", label: "Khóa học của tôi", Icon: BookOpen },
              { href: "/cua-hang", label: "Tiếp tục mua sắm", Icon: ShoppingBag },
              ...(isStaff(user.roles) ? [{ href: "/admin", label: "Quản trị", Icon: LayoutDashboard }] : []),
            ].map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 rounded-2xl border border-line p-5 font-semibold hover:border-sky">
                  <Icon size={22} strokeWidth={1.75} className="text-sky-ink" aria-hidden="true" /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="mt-10" onClick={() => void logout().then(() => window.location.assign("/"))}>Đăng xuất</Button>
        </div>
      )}
    </RequireSession>
  );
}
