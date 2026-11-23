// Zone geometry from Quyết định 18/2020/QĐ-TTg. Coordinates are [lon, lat] (WGS-84).
import { bearing, convex, difference, featureCollection, destination as turfDestination, point } from "@turf/turf";

/** Rule distances, in metres. */
export const AIRPORT = {
  /** Điều 3 khoản 4: no-fly rectangle beyond each runway end and to each side of the centreline. */
  camAlong: 15_000,
  camAcross: 5_000,
  /** Điều 4 khoản 4: the restricted band adds this much length and width outside the no-fly rectangle. */
  hanCheAlong: 5_000,
  hanCheAcross: 3_000,
};

export const destination = (from, bearingDeg, metres) => turfDestination(point(from), metres / 1000, bearingDeg, { units: "kilometers" }).geometry.coordinates;

/** Four corners of a rectangle around one runway, extended `along` past each end and `across` to each side. */
function corners([a, b], along, across) {
  const axis = bearing(point(a), point(b));
  const farA = destination(a, axis + 180, along);
  const farB = destination(b, axis, along);
  return [destination(farA, axis - 90, across), destination(farB, axis - 90, across), destination(farB, axis + 90, across), destination(farA, axis + 90, across)];
}

/** Hull of all runways' rectangles, so an airport with several runways gets one zone around the outermost ones. */
function hull(runways, along, across) {
  const pts = runways.flatMap((r) => corners(r.ends, along, across)).map((c) => point(c));
  return convex(featureCollection(pts));
}

/** No-fly polygon and the restricted ring around it for one airport. */
export function airportRectangles(runways) {
  const cam = hull(runways, AIRPORT.camAlong, AIRPORT.camAcross);
  const outer = hull(runways, AIRPORT.camAlong + AIRPORT.hanCheAlong, AIRPORT.camAcross + AIRPORT.hanCheAcross);
  const hanChe = difference(featureCollection([outer, cam]));
  return { cam, hanChe };
}
