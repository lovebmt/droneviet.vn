import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import type { UserRole } from "./entities/user.entity";
import { SESSION_COOKIE, sessionCookieOptions } from "./session-cookie";

export type IssuedSession = { accessToken: string; user: { id: string; email: string; roles: UserRole[] } };

/** Starts and ends browser sessions via the httpOnly dv_session cookie (spec §9.2). */
@Injectable()
export class SessionService {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Sets the cookie and returns the session body unchanged (accessToken kept for admin tools). */
  async start<T extends IssuedSession>(session: T, res: Response): Promise<T> {
    res.cookie(SESSION_COOKIE, await this.auth.signSessionToken(session.user), this.options());
    return session;
  }

  clear(res: Response): void {
    const { maxAge: _maxAge, ...options } = this.options();
    res.clearCookie(SESSION_COOKIE, options);
  }

  private options() {
    return sessionCookieOptions({
      NODE_ENV: this.config.get<string>("NODE_ENV"),
      COOKIE_DOMAIN: this.config.get<string>("COOKIE_DOMAIN"),
    });
  }
}
