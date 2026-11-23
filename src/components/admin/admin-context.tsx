"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/api/types";

export const AdminUserContext = createContext<SessionUser | null>(null);

/** The signed-in staff user; only valid inside the admin layout. */
export function useAdminUser(): SessionUser {
  const user = useContext(AdminUserContext);
  if (!user) throw new Error("useAdminUser must be used inside the admin layout");
  return user;
}
