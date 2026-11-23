import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ContentTokenGuard } from "./content-token.guard";

function context(authorization?: string) {
  const request: { headers: { authorization?: string }; user?: unknown } = { headers: { authorization } };
  return {
    request,
    ctx: {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as never,
  };
}

function guard(token: string | undefined, jwtRoles: string[] | null = null) {
  const config = { get: (key: string) => (key === "CONTENT_PUBLISH_TOKEN" ? token : undefined) };
  const jwt = {
    verifyAsync: vi.fn(async () => {
      if (!jwtRoles) throw new Error("bad jwt");
      return { sub: "u1", roles: jwtRoles };
    }),
  };
  const reflector = { getAllAndOverride: () => undefined };
  return new ContentTokenGuard(config as never, jwt as never, reflector as never);
}

describe("ContentTokenGuard", () => {
  it("accepts the configured content token and marks the request as the publisher", async () => {
    const { ctx, request } = context("Bearer publish-secret-123456");
    await expect(guard("publish-secret-123456").canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: "content-token" });
  });

  it("rejects a wrong or missing token with 401", async () => {
    await expect(guard("publish-secret-123456").canActivate(context("Bearer nope").ctx)).rejects.toThrow(UnauthorizedException);
    await expect(guard("publish-secret-123456").canActivate(context(undefined).ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects every token when CONTENT_PUBLISH_TOKEN is unset", async () => {
    await expect(guard(undefined).canActivate(context("Bearer ").ctx)).rejects.toThrow(UnauthorizedException);
    await expect(guard("").canActivate(context("Bearer ").ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("still lets a super_admin session in, but not a customer", async () => {
    await expect(guard(undefined, ["super_admin"]).canActivate(context("Bearer admin.jwt").ctx)).resolves.toBe(true);
    await expect(guard(undefined, ["customer"]).canActivate(context("Bearer customer.jwt").ctx)).rejects.toThrow(UnauthorizedException);
  });
});
