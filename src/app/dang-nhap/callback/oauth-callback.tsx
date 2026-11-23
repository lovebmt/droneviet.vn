"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { exchangeOauthCode, type CustomerSession } from "@/lib/commerce/customer-auth";

/** Lands the Google/Zalo redirect: trades the one-time code from the API for a session. */
export function OauthCallback({ code }: { code?: string }) {
  const [state, setState] = useState<
    { status: "pending" } | { status: "done"; session: CustomerSession } | { status: "failed" }
  >(code ? { status: "pending" } : { status: "failed" });

  useEffect(() => {
    if (!code) {
      return;
    }
    let active = true;
    exchangeOauthCode(code)
      .then((session) => active && setState({ status: "done", session }))
      .catch(() => active && setState({ status: "failed" }));
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-5 text-[#10232A]">
      <section className="w-full max-w-sm border border-black/10 bg-white p-6">
        {state.status === "pending" ? (
          <h1 className="text-2xl font-semibold">Đang đăng nhập…</h1>
        ) : state.status === "done" ? (
          <>
            <h1 className="text-2xl font-semibold">Đăng nhập thành công</h1>
            <p className="mt-4 text-sm text-slate-600">{state.session.user.email}</p>
            <Link href="/cua-hang" className="mt-6 inline-flex text-sm font-semibold text-[#006D66]">
              Tiếp tục mua sắm
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Đăng nhập không thành công</h1>
            <p className="mt-4 text-sm text-slate-600">Liên kết đăng nhập đã hết hạn hoặc không hợp lệ.</p>
            <Link href="/dang-nhap" className="mt-6 inline-flex text-sm font-semibold text-[#006D66]">
              Thử lại
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
