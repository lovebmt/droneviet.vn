import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import type { OauthProvider } from "./entities/oauth-ticket.entity";
import { OauthService } from "./oauth.service";

const PROVIDERS: readonly OauthProvider[] = ["google", "zalo"];

function asProvider(value: string): OauthProvider {
  if (!PROVIDERS.includes(value as OauthProvider)) {
    throw new BadRequestException("Unknown sign-in provider");
  }
  return value as OauthProvider;
}

@Controller("auth")
export class OauthController {
  private readonly logger = new Logger(OauthController.name);

  constructor(private readonly oauth: OauthService) {}

  /** Lets the web app show only the sign-in buttons that are configured. */
  @Get("providers")
  providers() {
    return this.oauth.providers();
  }

  @Post("oauth/exchange")
  exchange(@Body("code") code: string) {
    return this.oauth.exchange(String(code ?? ""));
  }

  @Get(":provider")
  async start(@Param("provider") provider: string, @Res() res: Response) {
    const which = asProvider(provider);
    const url = which === "google" ? await this.oauth.startGoogle() : await this.oauth.startZalo();
    return res.redirect(url);
  }

  @Get(":provider/callback")
  async callback(
    @Param("provider") provider: string,
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Res() res: Response,
  ) {
    const which = asProvider(provider);
    const web = this.oauth.frontendUrl();

    try {
      if (error || !code) {
        throw new BadRequestException(error ?? "Missing authorization code");
      }
      const exchangeCode =
        which === "google"
          ? await this.oauth.finishGoogle(code, state ?? "")
          : await this.oauth.finishZalo(code, state ?? "");
      const params = new URLSearchParams({ code: exchangeCode, provider: which });
      return res.redirect(`${web}/dang-nhap/callback?${params}`);
    } catch (failure) {
      this.logger.warn(`${which} sign-in failed: ${failure instanceof Error ? failure.message : failure}`);
      return res.redirect(`${web}/dang-nhap?error=${which}`);
    }
  }
}
