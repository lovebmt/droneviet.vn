"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useSession } from "@/components/providers/session-provider";
import type { SessionUser } from "@/lib/api/types";

/** Renders children for a signed-in user; otherwise sends them to sign in and back here. */
export function RequireSession({ children }: { children: (user: SessionUser) => ReactNode }) {
  const { user, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") router.replace(`/dang-nhap?tiep=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== "signed-in" || !user) return <p className="text-muted">Đang kiểm tra đăng nhập…</p>;
  return <>{children(user)}</>;
}
