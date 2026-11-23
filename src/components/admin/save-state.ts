"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { adminError } from "./use-admin-data";

/** One save action with idle → saving → saved/error, used by every admin form. */
export function useSave() {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  async function run(path: string, method: "PATCH" | "PUT" | "POST", body: unknown): Promise<boolean> {
    setState("saving");
    setError(null);
    try {
      await apiFetch(path, { method, body: JSON.stringify(body) });
      setState("saved");
      return true;
    } catch (e) {
      setState("idle");
      setError(adminError(e));
      return false;
    }
  }
  return { state, error, run, reset: () => setState("idle") };
}
