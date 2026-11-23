import { describe, expect, it } from "vitest";
import { formatDate, formatVnd } from "./format";

describe("format", () => {
  it("formatVnd groups thousands with dots and appends ₫", () => {
    expect(formatVnd(9_500_000)).toBe("9.500.000 ₫");
    expect(formatVnd(0)).toBe("0 ₫");
  });

  it("formatDate shows day/month/year", () => {
    expect(formatDate("2026-11-23T08:00:00.000Z")).toBe("23/11/2026");
  });
});
