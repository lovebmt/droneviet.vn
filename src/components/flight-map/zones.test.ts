import { describe, expect, it } from "vitest";
import { type ZoneCollection, zoneAt } from "./zones";

const square = (lon: number, lat: number, d: number): [number, number][][] => [[[lon - d, lat - d], [lon + d, lat - d], [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]];

const zones: ZoneCollection = {
  type: "FeatureCollection",
  metadata: { builtAt: "2026-11-23", sources: [] },
  features: [
    { type: "Feature", properties: { kind: "han-che", category: "san-bay-tiep-giap", name: "Nội Bài", rule: "QĐ 18/2020/QĐ-TTg, Điều 4 khoản 4" }, geometry: { type: "Polygon", coordinates: square(105.8, 21.2, 0.3) } },
    { type: "Feature", properties: { kind: "cam", category: "san-bay", name: "Nội Bài", rule: "QĐ 18/2020/QĐ-TTg, Điều 3 khoản 4" }, geometry: { type: "Polygon", coordinates: square(105.8, 21.2, 0.15) } },
    {
      type: "Feature",
      properties: { kind: "han-che", category: "bien-gioi", name: "Biên giới Việt Nam, Lào", rule: "QĐ 18/2020/QĐ-TTg, Điều 4 khoản 3" },
      geometry: { type: "MultiPolygon", coordinates: [square(103, 20, 0.1), square(104, 18, 0.1)] },
    },
  ],
};

describe("zoneAt", () => {
  it("a point beside Nội Bài is in the no-fly zone", () => {
    const result = zoneAt([105.82, 21.21], zones);
    expect(result.status).toBe("cam");
    expect(result.zones.map((z) => z.properties.category)).toContain("san-bay");
  });

  it("no-fly wins over restricted", () => {
    expect(zoneAt([105.8, 21.2], zones).status).toBe("cam");
    expect(zoneAt([105.8, 21.45], zones).status).toBe("han-che");
  });

  it("finds a point in the second part of a multipolygon", () => {
    expect(zoneAt([104.05, 18.02], zones).status).toBe("han-che");
  });

  it('a point outside every zone is "unknown", not "allowed"', () => {
    const result = zoneAt([109.5, 12.2], zones);
    expect(result).toEqual({ status: "unknown", zones: [] });
  });
});

describe("built zone data (public/geo/flight-zones.json)", async () => {
  const { readFileSync } = await import("node:fs");
  const built = JSON.parse(readFileSync("public/geo/flight-zones.json", "utf8")) as ZoneCollection;

  it("covers the airports and the three land borders", () => {
    expect(built.features.filter((f) => f.properties.category === "san-bay").length).toBeGreaterThanOrEqual(20);
    for (const country of ["Trung Quốc", "Lào", "Campuchia"]) {
      expect(built.features.some((f) => f.properties.category === "bien-gioi" && f.properties.name.includes(country))).toBe(true);
    }
    expect(built.metadata.sources.join(" ")).toContain("OpenStreetMap");
  });

  it("puts Nội Bài in a no-fly zone and Lào Cai in the 25 km border band", () => {
    expect(zoneAt([105.807, 21.2187], built).zones.map((z) => z.properties.name)).toContain("Sân bay Quốc tế Nội Bài");
    expect(zoneAt([103.97, 22.49], built).zones.some((z) => z.properties.category === "bien-gioi")).toBe(true);
  });
});
