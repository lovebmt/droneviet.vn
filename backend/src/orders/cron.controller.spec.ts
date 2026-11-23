import { UnauthorizedException } from "@nestjs/common";
import { afterEach, describe, expect, it } from "vitest";
import { CronController } from "./cron.controller";
import type { OrdersService } from "./orders.service";

function controllerReleasing(count: number) {
  const calls: number[] = [];
  const orders = {
    releaseExpiredReservations: async () => {
      calls.push(count);
      return count;
    },
  } as unknown as OrdersService;
  return { controller: new CronController(orders), calls };
}

describe("CronController.releaseReservations", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects a missing or wrong bearer token without running cleanup", async () => {
    process.env.CRON_SECRET = "s3cret";
    const { controller, calls } = controllerReleasing(2);

    await expect(controller.releaseReservations(undefined)).rejects.toThrow(UnauthorizedException);
    await expect(controller.releaseReservations("Bearer nope")).rejects.toThrow(UnauthorizedException);
    expect(calls).toHaveLength(0);
  });

  it("rejects every request when CRON_SECRET is unset", async () => {
    const { controller, calls } = controllerReleasing(2);

    await expect(controller.releaseReservations("Bearer ")).rejects.toThrow(UnauthorizedException);
    await expect(controller.releaseReservations("Bearer undefined")).rejects.toThrow(UnauthorizedException);
    expect(calls).toHaveLength(0);
  });

  it("returns the released count with the correct bearer token", async () => {
    process.env.CRON_SECRET = "s3cret";
    const { controller } = controllerReleasing(3);

    await expect(controller.releaseReservations("Bearer s3cret")).resolves.toEqual({ released: 3 });
  });
});
