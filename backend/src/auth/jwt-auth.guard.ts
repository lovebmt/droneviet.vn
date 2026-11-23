import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "./entities/user.entity";
import { readSessionToken } from "./session-cookie";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: UserRole[];
}

type AuthRequest = { headers: { authorization?: string }; cookies?: Record<string, string>; user?: AccessTokenPayload };

/** Requires a valid session (Bearer token or dv_session cookie); 401 otherwise. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = readSessionToken(request);
    if (!token) {
      throw new UnauthorizedException("Sign in required");
    }
    try {
      request.user = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException("Session expired - sign in again");
    }
  }
}
