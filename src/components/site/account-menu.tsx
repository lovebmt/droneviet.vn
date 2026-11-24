"use client";

import Link from "next/link";
import { BookOpen, LayoutDashboard, LogOut, Package, UserRound } from "lucide-react";
import { type FocusEvent, useEffect, useRef, useState } from "react";
import { ACCOUNT_LINKS } from "@/components/account/account-links";
import { isStaff } from "@/components/admin/sections";
import { useSession } from "@/components/providers/session-provider";
import { PRESS } from "./press";

const ICON = { size: 20, strokeWidth: 1.75, "aria-hidden": true } as const;
const ITEM_ICON = { size: 18, strokeWidth: 1.75, "aria-hidden": true, className: "text-sky-ink" } as const;
const ICONS = { "/tai-khoan": UserRound, "/tai-khoan/don-hang": Package, "/tai-khoan/khoa-hoc": BookOpen } as const;
const TRIGGER = `rounded-full p-2 hover:bg-sky-50 sm:p-2.5 ${PRESS.item}`;

/**
 * Signed out: a link to sign in. Signed in: a menu (hover, click or touch) with the account pages,
 * Quản trị for staff, and Đăng xuất. Closes when the pointer leaves, on Escape, on a click outside,
 * when focus moves away, or once an item is chosen.
 */
export function AccountMenu() {
  const { user, status, logout } = useSession();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  if (status !== "signed-in" || !user) {
    return (
      <Link href="/dang-nhap" aria-label="Đăng nhập" className={TRIGGER}>
        <UserRound {...ICON} />
      </Link>
    );
  }

  const item = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] hover:bg-sky-50 ${PRESS.child}`;
  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
      onBlur={(e: FocusEvent<HTMLDivElement>) => !e.currentTarget.contains(e.relatedTarget as Node | null) && close()}
      onKeyDown={(e) => e.key === "Escape" && close()}
    >
      <button type="button" aria-label="Tài khoản của tôi" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${TRIGGER} ${open ? "bg-sky-50" : ""}`}>
        <UserRound {...ICON} />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 w-64 pt-2">
          <div role="region" aria-label="Tài khoản" className="rounded-2xl border border-line bg-white p-2 shadow-lg">
            <div className="border-b border-line px-3 pb-3 pt-2">
              {user.displayName ? <p className="truncate font-semibold">{user.displayName}</p> : null}
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
            <ul className="py-1">
              {ACCOUNT_LINKS.map((l) => {
                const Icon = ICONS[l.href];
                return (
                  <li key={l.href}>
                    <Link href={l.href} onClick={close} className={item}>
                      <Icon {...ITEM_ICON} /> {l.menuLabel}
                    </Link>
                  </li>
                );
              })}
              {isStaff(user.roles) ? (
                <li>
                  <Link href="/admin" onClick={close} className={item}>
                    <LayoutDashboard {...ITEM_ICON} /> Quản trị
                  </Link>
                </li>
              ) : null}
            </ul>
            <div className="border-t border-line pt-1">
              <button type="button" onClick={() => void logout().then(() => window.location.assign("/"))} className={`w-full text-left ${item}`}>
                <LogOut {...ITEM_ICON} /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
