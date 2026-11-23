"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { SessionUser } from "@/lib/api/types";

type Status = "loading" | "signed-in" | "signed-out";

interface SessionValue {
  user: SessionUser | null;
  status: Status;
  refresh(): Promise<void>;
  logout(): Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/** Session lives in the httpOnly dv_session cookie; this only asks the API who is signed in. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const refresh = useCallback(async () => {
    try {
      const me = await apiFetch<SessionUser>("/auth/me");
      setUser(me);
      setStatus("signed-in");
    } catch {
      setUser(null);
      setStatus("signed-out");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setStatus("signed-out");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ user, status, refresh, logout }), [user, status, refresh, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
