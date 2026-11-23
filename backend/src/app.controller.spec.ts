import { describe, expect, it } from "vitest";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  it("reports the commerce API as healthy", () => {
    const controller = new AppController(new AppService());

    expect(controller.health()).toEqual({
      service: "droneviet-commerce-api",
      status: "ok",
    });
  });

  it("serves a tiny HTML home whose head starts with the Zalo domain-verification meta tag", () => {
    const html = new AppController(new AppService()).home();

    expect(html.indexOf('<meta name="zalo-platform-site-verification" content="PzQUCUMW91XYhF8xX8af0KEYinklr6XDDJCo" />')).toBeGreaterThan(-1);
    expect(html.indexOf("zalo-platform-site-verification")).toBeLessThan(200);
    expect(html).toContain("https://www.droneviet.vn");
  });
});
