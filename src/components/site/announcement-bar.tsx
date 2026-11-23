"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicSettings } from "@/lib/api/types";

const KEY = "dv-announcement-dismissed";

/** Thin bar above the header (spec §7.5); dismissal lasts for the browser session. */
export function AnnouncementBar({ announcement }: { announcement: PublicSettings["announcement"] }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let value = false;
    try {
      value = sessionStorage.getItem(KEY) === announcement?.text;
    } catch {
      value = false;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(value);
  }, [announcement?.text]);

  if (!announcement || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(KEY, announcement!.text);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative bg-sky-50 px-10 py-2 text-center text-sm text-ink">
      {announcement.href ? (
        <Link href={announcement.href} className="underline-offset-4 hover:underline">
          {announcement.text}
        </Link>
      ) : (
        announcement.text
      )}
      <button type="button" onClick={dismiss} aria-label="Ẩn thông báo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white">
        <X size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
