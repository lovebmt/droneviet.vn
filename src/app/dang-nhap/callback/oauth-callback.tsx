"use client";

import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { exchangeOauthCode, type CustomerSession } from "@/lib/commerce/customer-auth";
import { goTo } from "@/lib/navigate";
import { takeNextPath } from "@/lib/next-path";

/** Lands the Google/Zalo redirect: trades the one-time code for a session, then returns the user. */
export function OauthCallback({ code }: { code?: string }) {
  const [state, setState] = useState<{ status: "pending" } | { status: "done"; session: CustomerSession; next: string } | { status: "failed" }>(
    code ? { status: "pending" } : { status: "failed" },
  );

  useEffect(() => {
    if (!code) return;
    let active = true;
    exchangeOauthCode(code)
      .then((session) => {
        if (!active) return;
        const next = takeNextPath() ?? "/tai-khoan";
        setState({ status: "done", session, next });
        goTo(next);
      })
      .catch(() => active && setState({ status: "failed" }));
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-5">
      <section className="w-full max-w-sm text-center">
        {state.status === "pending" ? (
          <h1 className="text-2xl font-semibold">Đang đăng nhập…</h1>
        ) : state.status === "done" ? (
          <>
            <CheckCircle2 size={40} strokeWidth={1.5} className="mx-auto text-teal-ink" aria-hidden="true" />
            <h1 className="mt-3 text-2xl font-semibold">Đăng nhập thành công</h1>
            <p className="mt-2 text-muted">{state.session.user.email}</p>
            <Link href={state.next} className="mt-6 inline-flex font-semibold text-sky underline underline-offset-4">Tiếp tục</Link>
          </>
        ) : (
          <>
            <CircleAlert size={40} strokeWidth={1.5} className="mx-auto text-muted" aria-hidden="true" />
            <h1 className="mt-3 text-2xl font-semibold">Đăng nhập không thành công</h1>
            <p className="mt-2 text-muted">Liên kết đăng nhập đã hết hạn hoặc không hợp lệ.</p>
            <Link href="/dang-nhap" className="mt-6 inline-flex font-semibold text-sky underline underline-offset-4">Thử lại</Link>
          </>
        )}
      </section>
    </div>
  );
}
