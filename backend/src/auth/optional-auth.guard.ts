import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AccessTokenPayload } from "./jwt-auth.guard";
import { readSessionToken } from "./session-cookie";

/** Attaches request.user when a valid session is present; never rejects (guest checkout). */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; cookies?: Record<string, string>; user?: AccessTokenPayload }>();
    const token = readSessionToken(request);
    if (token) {
      try {
        request.user = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      } catch {
        request.user = undefined;
      }
    }
    return true;
  }
}
