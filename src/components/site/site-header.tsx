"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { useSession } from "@/components/providers/session-provider";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { mainNav } from "./nav";
import { PRESS } from "./press";

const ICON = { size: 20, strokeWidth: 1.75, "aria-hidden": true } as const;

export function SiteHeader() {
  const { count } = useCart();
  const { status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const signedIn = status === "signed-in";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Logo />

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className={`block rounded-full px-3 py-2 text-[15px] font-medium ${
                  item.highlight ? `bg-sun text-ink hover:bg-[#f5b800] ${PRESS.highlight}` : `text-ink hover:bg-sky-50 ${PRESS.item}`
                }`}
              >
                {item.label}
              </Link>
              {item.children ? (
                <div className="invisible absolute left-0 top-full z-50 w-[520px] pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} className={`block rounded-xl p-3 hover:bg-sky-50 ${PRESS.child}`}>
                          <span className="block text-[15px] font-semibold">{child.label}</span>
                          {child.description ? <span className="mt-0.5 block text-sm text-muted">{child.description}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="flex items-center sm:gap-1">
          <Link href="/tim-kiem" aria-label="Tìm kiếm" className={`rounded-full p-2 hover:bg-sky-50 max-[359px]:hidden sm:p-2.5 ${PRESS.item}`}>
            <Search {...ICON} />
          </Link>
          <Link
            href={signedIn ? "/tai-khoan" : "/dang-nhap"}
            aria-label={signedIn ? "Tài khoản của tôi" : "Đăng nhập"}
            className={`rounded-full p-2 hover:bg-sky-50 sm:p-2.5 ${PRESS.item}`}
          >
            <UserRound {...ICON} />
          </Link>
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
