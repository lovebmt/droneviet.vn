import { apiFetch } from "@/lib/api/client";

export interface SimResult {
  mission: string;
  score: number;
  stars: number;
  timeMs: number;
  crashes: number;
}

const KEY = "dv-sim-best";

/** Best result per mission on this device; blocked or corrupt storage reads as empty. */
export function loadBest(): Record<string, SimResult> {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, SimResult>) : {};
  } catch {
    return {};
  }
}

/** Keeps the best score locally; when signed in also stores it in the account. Never throws. */
export async function saveResult(result: SimResult, signedIn: boolean): Promise<void> {
  try {
    const best = loadBest();
    if (!best[result.mission] || result.score > best[result.mission].score) {
      best[result.mission] = result;
      localStorage.setItem(KEY, JSON.stringify(best));
    }
  } catch {
    // storage unavailable: the result still shows on screen
  }
  if (!signedIn) return;
  try {
    await apiFetch("/me/sim-results", { method: "POST", body: JSON.stringify(result) });
  } catch {
    // offline or session expired: the local copy is enough
  }
}
