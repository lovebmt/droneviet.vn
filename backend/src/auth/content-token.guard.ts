import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { timingSafeEqual } from "node:crypto";
import { UserRole } from "./entities/user.entity";
import { ROLES_KEY } from "./roles.decorator";

/**
 * Lets the R&D publishing skill in with CONTENT_PUBLISH_TOKEN (spec §9.4), or a signed-in admin
 * whose roles match @Roles (default super_admin). Anything else is 401.
 */
@Injectable()
export class ContentTokenGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: unknown }>();
    const bearer = request.headers.authorization?.startsWith("Bearer ")
      ? request.headers.authorization.slice("Bearer ".length)
      : "";

    const token = this.config.get<string>("CONTENT_PUBLISH_TOKEN") ?? "";
    if (token && bearer && sameSecret(bearer, token)) {
      request.user = { sub: "content-token", roles: [] };
      return true;
    }

    const allowed =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) ??
      [UserRole.SUPER_ADMIN];
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; roles?: UserRole[] }>(bearer);
      if ((payload.roles ?? []).some((role) => allowed.includes(role))) {
        request.user = payload;
        return true;
      }
    } catch {
      // fall through to 401
    }
    throw new UnauthorizedException("A valid content token or an admin session is required");
  }
}

function sameSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
