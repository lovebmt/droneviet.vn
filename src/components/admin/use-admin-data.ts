"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";

/** Loads an admin list; `reload()` after a write. Errors become a readable message. */
export function useAdminData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    let active = true;
    apiFetch<T>(path).then(
      (value) => active && (setData(value), setError(null)),
      (e: unknown) => active && setError(adminError(e)),
    );
    return () => {
      active = false;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, error, reload };
}

export function adminError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "Phiên đăng nhập đã hết hạn. Đăng nhập lại.";
    if (e.status === 403) return "Tài khoản của bạn không có quyền thực hiện thao tác này.";
    return e.message;
  }
  return "Không kết nối được máy chủ. Thử lại sau.";
}
