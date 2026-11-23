import { describe, expect, it } from "vitest";
import { nextWeekendMornings } from "./workshop-schedule";

const iso = (dates: Date[]) => dates.map((d) => d.toISOString());

describe("nextWeekendMornings (9:00 Vietnam time = 02:00 UTC)", () => {
  it("on a weekday offers the coming Saturday and Sunday", () => {
    // Monday 24/11/2026, 10:00 in Vietnam
    expect(iso(nextWeekendMornings(new Date("2026-11-24T03:00:00Z")))).toEqual(["2026-11-28T02:00:00.000Z", "2026-11-29T02:00:00.000Z"]);
  });

  it("early on Saturday still offers that Saturday", () => {
    expect(iso(nextWeekendMornings(new Date("2026-11-28T01:30:00Z")))).toEqual(["2026-11-28T02:00:00.000Z", "2026-11-29T02:00:00.000Z"]);
  });

  it("after 9:00 on Saturday offers Sunday and the next Saturday", () => {
    expect(iso(nextWeekendMornings(new Date("2026-11-28T02:00:00Z")))).toEqual(["2026-11-29T02:00:00.000Z", "2026-12-05T02:00:00.000Z"]);
  });

  it("late on Saturday evening in Vietnam (still Saturday UTC) offers Sunday and the next Saturday", () => {
    expect(iso(nextWeekendMornings(new Date("2026-11-28T16:00:00Z")))).toEqual(["2026-11-29T02:00:00.000Z", "2026-12-05T02:00:00.000Z"]);
  });

  it("after 9:00 on Sunday offers the next weekend", () => {
    expect(iso(nextWeekendMornings(new Date("2026-11-29T05:00:00Z")))).toEqual(["2026-12-05T02:00:00.000Z", "2026-12-06T02:00:00.000Z"]);
  });
});
