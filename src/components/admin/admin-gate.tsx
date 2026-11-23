"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";
import type { ReactNode } from "react";
import { RequireSession } from "@/components/account/require-session";
import type { SessionUser } from "@/lib/api/types";
import { isStaff } from "./sections";

/** Signed-out → sign in and back; signed in without a staff role → no access, no admin requests. */
export function AdminGate({ children }: { children: (user: SessionUser) => ReactNode }) {
  return (
    <RequireSession>
      {(user) =>
        isStaff(user.roles) ? (
          children(user)
        ) : (
          <div className="mx-auto max-w-md py-16 text-center">
            <ShieldOff size={40} strokeWidth={1.5} className="mx-auto text-muted" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-semibold">Không có quyền truy cập</h1>
            <p className="mt-2 text-muted">Tài khoản {user.email} không có quyền quản trị. Liên hệ quản trị viên nếu bạn cần quyền.</p>
            <Link href="/" className="mt-6 inline-block font-semibold text-sky underline underline-offset-4">Về trang chủ</Link>
          </div>
        )
      }
    </RequireSession>
  );
}
