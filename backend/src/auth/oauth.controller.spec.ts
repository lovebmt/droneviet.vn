import { describe, expect, it, vi } from "vitest";
import { OauthController } from "./oauth.controller";
import { OauthFailure } from "./oauth.service";

function setup(overrides: Record<string, unknown> = {}) {
  const oauth = {
    exchange: vi.fn(async () => ({ accessToken: "t" })),
    finishGoogle: vi.fn(async () => "exchange-code"),
    finishZalo: vi.fn(async () => "exchange-code"),
    frontendUrl: () => "https://www.droneviet.vn",
    providers: () => ({ google: true, zalo: false }),
    startGoogle: vi.fn(async () => "https://accounts.google.com/o/oauth2/v2/auth?x=1"),
    startZalo: vi.fn(async () => "https://oauth.zaloapp.com/v4/permission?x=1"),
    ...overrides,
  };
  const res = { redirect: vi.fn() };
  return { controller: new OauthController(oauth as never), oauth, res };
}

describe("OauthController", () => {
  it("exposes which providers are configured", () => {
    expect(setup().controller.providers()).toEqual({ google: true, zalo: false });
  });

  it("redirects to the provider consent screen", async () => {
    const { controller, res } = setup();
    await controller.start("google", res as never);
    expect(res.redirect).toHaveBeenCalledWith("https://accounts.google.com/o/oauth2/v2/auth?x=1");
  });

  it("sends the browser back to the web callback page with a one-time code", async () => {
    const { controller, oauth, res } = setup();
    await controller.callback("zalo", "auth-code", "state-1", undefined, res as never);
    expect(oauth.finishZalo).toHaveBeenCalledWith("auth-code", "state-1");
    expect(res.redirect).toHaveBeenCalledWith(
      "https://www.droneviet.vn/dang-nhap/callback?code=exchange-code&provider=zalo",
    );
  });

  it("sends the browser back with an error when sign-in fails or is cancelled", async () => {
    const { controller, res } = setup({ finishGoogle: vi.fn(async () => { throw new Error("boom"); }) });
    await controller.callback("google", "auth-code", "s", undefined, res as never);
    await controller.callback("google", undefined, "s", "access_denied", res as never);
    expect(res.redirect).toHaveBeenNthCalledWith(1, "https://www.droneviet.vn/dang-nhap?error=google&reason=unknown");
    expect(res.redirect).toHaveBeenNthCalledWith(2, "https://www.droneviet.vn/dang-nhap?error=google&reason=denied");
  });

  it("passes the failing step back to the web so the login page can show a reason code", async () => {
    const { controller, res } = setup({
      finishZalo: vi.fn(async () => {
        throw new OauthFailure("token_exchange", "Zalo token exchange failed");
      }),
    });
    await controller.callback("zalo", "auth-code", "s", undefined, res as never);
    expect(res.redirect).toHaveBeenCalledWith("https://www.droneviet.vn/dang-nhap?error=zalo&reason=token_exchange");
  });

  it("rejects unknown providers on start", async () => {
    const { controller, res } = setup();
    await expect(controller.start("facebook" as never, res as never)).rejects.toThrow();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
