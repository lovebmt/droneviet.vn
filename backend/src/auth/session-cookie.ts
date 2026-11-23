import type { CookieOptions } from "express";

/** httpOnly session cookie shared by www and api on .droneviet.vn (spec §9.2). */
export const SESSION_COOKIE = "dv_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function sessionCookieOptions(env: { NODE_ENV?: string; COOKIE_DOMAIN?: string }): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
    secure: env.NODE_ENV === "production",
    domain: env.COOKIE_DOMAIN || undefined,
  };
}

/** Bearer header first (admin tools, tests), then the session cookie (browsers). */
export function readSessionToken(request: { headers: { authorization?: string }; cookies?: Record<string, string> }): string | null {
  const authorization = request.headers.authorization;
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }
  return request.cookies?.[SESSION_COOKIE] || null;
}
