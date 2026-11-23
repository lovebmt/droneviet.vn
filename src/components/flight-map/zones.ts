/** Flight zones built by scripts/flight-zones/build.mjs from Quyết định 18/2020/QĐ-TTg (public/geo/flight-zones.json). */
export type ZoneKind = "cam" | "han-che";

export interface ZoneProperties {
  kind: ZoneKind;
  category: "san-bay" | "san-bay-tiep-giap" | "bien-gioi";
  name: string;
  /** Legal basis, e.g. "QĐ 18/2020/QĐ-TTg, Điều 3 khoản 4". */
  rule: string;
}

type Ring = [number, number][];
export interface ZoneFeature {
  type: "Feature";
  properties: ZoneProperties;
  geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
}

export interface ZoneCollection {
  type: "FeatureCollection";
  metadata: { builtAt: string; sources: string[] };
  features: ZoneFeature[];
}

/** Even-odd ray casting; good enough at the scale of these zones. */
function inRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const inPolygon = (p: [number, number], rings: Ring[]) => inRing(p, rings[0]) && !rings.slice(1).some((hole) => inRing(p, hole));

function contains(feature: ZoneFeature, p: [number, number]): boolean {
  const g = feature.geometry;
  return g.type === "Polygon" ? inPolygon(p, g.coordinates) : g.coordinates.some((poly) => inPolygon(p, poly));
}

/**
 * Which drawn zones contain a point. No-fly wins over restricted. "unknown" means only that no drawn
 * zone contains it: military sites, offices and crowds are not drawn, so it never means "allowed".
 */
export function zoneAt(p: [number, number], zones: ZoneCollection): { status: ZoneKind | "unknown"; zones: ZoneFeature[] } {
  const hits = zones.features.filter((f) => contains(f, p));
  if (!hits.length) return { status: "unknown", zones: [] };
  return { status: hits.some((f) => f.properties.kind === "cam") ? "cam" : "han-che", zones: hits };
}
