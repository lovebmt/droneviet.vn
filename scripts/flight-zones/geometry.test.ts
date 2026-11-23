import { area, booleanPointInPolygon, point } from "@turf/turf";
import { describe, expect, it } from "vitest";
import { airportRectangles as build, destination } from "./geometry.mjs";

/** The builder returns turf's nullable features; a runway always yields both polygons. */
const airportRectangles = (runways: Parameters<typeof build>[0]) => {
  const { cam, hanChe } = build(runways);
  if (!cam || !hanChe) throw new Error("expected both zones");
  return { cam, hanChe };
};

// A 3 km north-south runway at Nội Bài's latitude.
const start: [number, number] = [105.8, 21.2];
const end = destination(start, 0, 3000) as [number, number];

describe("airport zones (QĐ 18/2020/QĐ-TTg Điều 3 khoản 4, Điều 4 khoản 4)", () => {
  it("a 3 km runway gives a 33 km × 10 km no-fly rectangle", () => {
    const { cam } = airportRectangles([{ name: "Test", ends: [start, end] }]);
    expect(area(cam) / 1e6).toBeGreaterThan(330 * 0.98);
    expect(area(cam) / 1e6).toBeLessThan(330 * 1.02);
  });

  it("restricted ring extends 5 km along and 3 km across", () => {
    const { cam, hanChe } = airportRectangles([{ name: "Test", ends: [start, end] }]);
    // Outer rectangle (3 + 2×20) × (2×8) = 43 × 16 = 688 km²; the ring excludes the 330 km² no-fly part.
    expect(area(hanChe) / 1e6).toBeGreaterThan((688 - 330) * 0.97);
    expect(area(hanChe) / 1e6).toBeLessThan((688 - 330) * 1.03);
    const along = destination(end, 0, 17_000); // 2 km past the no-fly edge, inside the ring
    const across = destination(destination(start, 0, 1500), 90, 6_500);
    expect(booleanPointInPolygon(point(along), hanChe)).toBe(true);
    expect(booleanPointInPolygon(point(along), cam)).toBe(false);
    expect(booleanPointInPolygon(point(across), hanChe)).toBe(true);
    expect(booleanPointInPolygon(point(destination(end, 0, 21_000)), hanChe)).toBe(false);
  });

  it("parallel runways are wrapped together", () => {
    const shifted = (p: [number, number]) => destination(p, 90, 2000) as [number, number];
    const { cam } = airportRectangles([{ name: "A", ends: [start, end] }, { name: "B", ends: [shifted(start), shifted(end)] }]);
    // 33 km × (5 + 2 + 5) km = 396 km²
    expect(area(cam) / 1e6).toBeGreaterThan(396 * 0.98);
    expect(area(cam) / 1e6).toBeLessThan(396 * 1.02);
    expect(booleanPointInPolygon(point(destination(shifted(start), 0, 1500)), cam)).toBe(true);
  });
});
