import { describe, expect, it } from "vitest";
import { SESSION_COOKIE, sessionCookieOptions } from "./session-cookie";

describe("session cookie options", () => {
  it("production cookie options are Secure, HttpOnly, Lax, Domain .droneviet.vn", () => {
    expect(SESSION_COOKIE).toBe("dv_session");
    expect(sessionCookieOptions({ NODE_ENV: "production", COOKIE_DOMAIN: ".droneviet.vn" })).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: true,
      domain: ".droneviet.vn",
    });
  });

  it("local options have no domain and no secure", () => {
    const options = sessionCookieOptions({ NODE_ENV: "development" });
    expect(options.secure).toBe(false);
    expect(options.domain).toBeUndefined();
    expect(options.httpOnly).toBe(true);
  });
});
