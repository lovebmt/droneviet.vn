/** The only way into Leaflet: a dynamic import, so the map library ships only with the map page. */
export function loadFlightMap() {
  return import("./engine/flight-map");
}
