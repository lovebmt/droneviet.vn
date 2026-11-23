import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { OrdersService } from "./orders.service";

/** Called by Vercel Cron (see vercel.json) with `Authorization: Bearer $CRON_SECRET`. */
@Controller("cron")
export class CronController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("release-reservations")
  async releaseReservations(
    @Headers("authorization") authorization: string | undefined,
  ): Promise<{ released: number }> {
    if (!isAuthorized(authorization, process.env.CRON_SECRET)) {
      throw new UnauthorizedException();
    }

    return { released: await this.ordersService.releaseExpiredReservations() };
  }
}

function isAuthorized(header: string | undefined, secret: string | undefined): boolean {
  if (!secret || !header) {
    return false;
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
