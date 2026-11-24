"use client";

import Link from "next/link";
import { ChevronDown, Menu, Search, ShoppingBag } from "lucide-react";
import { type FocusEvent, useCallback, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { mainNav, type NavItem } from "./nav";
import { PRESS } from "./press";

const ICON = { size: 20, strokeWidth: 1.75, "aria-hidden": true } as const;

/**
 * A section with sub-items: opens while the pointer is over it (or from the keyboard), closes when the
 * pointer leaves, on Escape, when focus moves away, or once a sub-item is chosen. The label itself never navigates.
 */
function NavMenu({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const id = `menu-${item.href.replace(/\W+/g, "")}`;
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={close}
      onBlur={(e: FocusEvent<HTMLDivElement>) => !e.currentTarget.contains(e.relatedTarget as Node | null) && close()}
      onKeyDown={(e) => e.key === "Escape" && close()}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium text-ink hover:bg-sky-50 ${open ? "bg-sky-50" : ""} ${PRESS.item}`}
      >
        {item.label}
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id={id} className="absolute left-0 top-full z-50 w-[520px] pt-2">
          <ul className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-3 shadow-lg">
            {item.children!.map((child) => (
              <li key={`${child.href}-${child.label}`}>
                <Link href={child.href} onClick={close} className={`block rounded-xl p-3 hover:bg-sky-50 ${PRESS.child}`}>
                  <span className="block text-[15px] font-semibold">{child.label}</span>
                  {child.description ? <span className="mt-0.5 block text-sm text-muted">{child.description}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Logo />

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) =>
            item.children ? (
              <NavMenu key={item.href} item={item} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-full px-3 py-2 text-[15px] font-medium ${
                  item.highlight ? `bg-sun text-ink hover:bg-[#f5b800] ${PRESS.highlight}` : `text-ink hover:bg-sky-50 ${PRESS.item}`
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center sm:gap-1">
          <Link href="/tim-kiem" aria-label="Tìm kiếm" className={`rounded-full p-2 hover:bg-sky-50 max-[359px]:hidden sm:p-2.5 ${PRESS.item}`}>
            <Search {...ICON} />
          </Link>
          <AccountMenu />
          <Link href="/gio-hang" aria-label={`Giỏ hàng, ${count} sản phẩm`} className={`relative rounded-full p-2 hover:bg-sky-50 sm:p-2.5 ${PRESS.item}`}>
            <ShoppingBag {...ICON} />
            {count > 0 ? (
              <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sky px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>
          <LinkButton href="/bao-gia" className="ml-2 max-sm:hidden">
            Nhận tư vấn
          </LinkButton>
          <button type="button" aria-label="Mở menu" onClick={() => setMenuOpen(true)} className={`rounded-full p-2 hover:bg-sky-50 sm:p-2.5 lg:hidden ${PRESS.item}`}>
            <Menu {...ICON} />
          </button>
        </div>
      </Container>
      {menuOpen ? <MobileMenu onClose={closeMenu} /> : null}
    </header>
  );
}
