/** Only same-site absolute paths are allowed as a post-sign-in destination (no open redirect). */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  return value;
}

const KEY = "dv-next-path";

/** OAuth leaves the site, so the destination is remembered for the callback page. */
export function rememberNextPath(path: string | null): void {
  try {
    if (path) sessionStorage.setItem(KEY, path);
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage blocked: the user lands on /tai-khoan instead
  }
}

export function takeNextPath(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return safeNextPath(value);
  } catch {
    return null;
  }
}
