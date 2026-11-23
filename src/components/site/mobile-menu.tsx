"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LinkButton } from "@/components/ui/button";
import { mainNav } from "./nav";
import { PRESS } from "./press";

/** Full-screen menu below lg: Escape closes, focus moves in and is trapped, page scroll is locked. */
export function MobileMenu({ onClose }: { onClose(): void }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Tab" && panel.current) {
        const focusable = panel.current.querySelectorAll<HTMLElement>("a,button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div ref={panel} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 overflow-y-auto bg-white lg:hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="font-bold">Drone Việt</span>
        <button type="button" onClick={onClose} aria-label="Đóng menu" className={`rounded-full p-2 hover:bg-sky-50 ${PRESS.item}`}>
          <X size={22} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Menu di động" className="px-5 py-4">
        <Link href="/tim-kiem" onClick={onClose} className={`mb-3 block rounded-xl border border-line px-3 py-3 text-muted ${PRESS.child}`}>
          Tìm sản phẩm, bài viết…
        </Link>
        <ul className="grid gap-1">
          {mainNav.map((item) => (
            <li key={item.href}>
              {item.children ? (
                <p className="px-3 pb-1 pt-3 text-lg font-semibold">{item.label}</p>
              ) : (
                <Link href={item.href} onClick={onClose} className={`block rounded-xl px-3 py-3 text-lg font-semibold ${item.highlight ? `bg-sun ${PRESS.highlight}` : `hover:bg-sky-50 ${PRESS.item}`}`}>
                  {item.label}
                </Link>
              )}
              {item.children ? (
                <ul className="mb-2 ml-3 grid gap-0.5 border-l border-line pl-3">
                  {item.children.map((child) => (
                    <li key={`${child.href}-${child.label}`}>
                      <Link href={child.href} onClick={onClose} className={`block rounded-lg px-2 py-2 text-muted hover:text-ink active:text-ink ${PRESS.child}`}>
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
        <LinkButton href="/bao-gia" size="lg" className="mt-6 w-full" onClick={onClose}>
          Nhận tư vấn
        </LinkButton>
      </nav>
    </div>
  ,
    document.body,
  );
}
