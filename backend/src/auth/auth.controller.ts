import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard, type AccessTokenPayload } from "./jwt-auth.guard";
import { SessionService } from "./session.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post("login")
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.sessions.start(await this.authService.login(input), res);
  }

  @Post("register")
  async register(@Body() input: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.sessions.start(await this.authService.register(input), res);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user: AccessTokenPayload }) {
    return this.authService.profile(request.user.sub);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    this.sessions.clear(res);
    return { ok: true };
  }
}
