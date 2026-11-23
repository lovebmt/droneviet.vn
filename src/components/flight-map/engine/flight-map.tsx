"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { MapPanel, type PickedPoint } from "../map-panel";
import type { ZoneCollection, ZoneFeature } from "../zones";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, vùng bay vẽ theo QĐ 18/2020/QĐ-TTg';
/** Mainland plus Hoàng Sa and Trường Sa, so the sovereignty labels are in the first view. */
const VIETNAM: L.LatLngBoundsExpression = [[8.2, 102.1], [23.4, 114.5]];
/** Sovereignty labels, always shown (the OSM base map may label these islands differently). */
const ISLANDS: Array<{ text: string; at: L.LatLngExpression }> = [
  { text: "Quần đảo Hoàng Sa (Việt Nam)", at: [16.5, 112.0] },
  { text: "Quần đảo Trường Sa (Việt Nam)", at: [10.0, 114.0] },
];
const STYLE = {
  cam: { color: "#B42318", weight: 1, fillColor: "#F04438", fillOpacity: 0.3 },
  "han-che": { color: "#B54708", weight: 1, fillColor: "#FDB022", fillOpacity: 0.25 },
} as const;

export function FlightMap() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const [zones, setZones] = useState<ZoneCollection | null>(null);
  const [picked, setPicked] = useState<PickedPoint | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!container.current || map.current) return;
    const m = L.map(container.current, { zoomSnap: 0.5, scrollWheelZoom: false }).fitBounds(VIETNAM);
    L.tileLayer(TILES, { maxZoom: 18, attribution: ATTRIBUTION }).addTo(m);
    for (const island of ISLANDS) {
      L.marker(island.at, { interactive: false, icon: L.divIcon({ className: "sovereignty-label", html: `<span>${island.text}</span>`, iconSize: [220, 20], iconAnchor: [110, 10] }) }).addTo(m);
    }
    m.on("click", (e: L.LeafletMouseEvent) => setPicked({ lat: e.latlng.lat, lon: e.latlng.lng }));
    m.on("focus", () => m.scrollWheelZoom.enable());
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/geo/flight-zones.json")
      .then((r) => (r.ok ? (r.json() as Promise<ZoneCollection>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!active || !map.current) return;
        setZones(data);
        L.geoJSON(data as unknown as GeoJSON.FeatureCollection, {
          style: (f) => STYLE[(f as unknown as ZoneFeature).properties.kind],
          onEachFeature: (f, layer) => layer.bindTooltip(`${(f as unknown as ZoneFeature).properties.name}`, { sticky: true }),
        }).addTo(map.current);
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, []);

  function pick(point: PickedPoint) {
    setPicked(point);
    const m = map.current;
    if (!m) return;
    m.setView([point.lat, point.lon], Math.max(m.getZoom(), 11));
  }

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    marker.current?.remove();
    marker.current = picked ? L.circleMarker([picked.lat, picked.lon], { radius: 8, color: "#0B6FE0", weight: 3, fillOpacity: 0.6 }).addTo(m) : null;
  }, [picked]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <div ref={container} className="h-[28rem] rounded-2xl sm:h-[36rem]" aria-label="Bản đồ khu vực bay" role="region" tabIndex={0} />
        {loadError ? <p role="alert" className="mt-2 text-sm">Không tải được dữ liệu vùng bay. Tải lại trang hoặc xem bản đồ chính thức.</p> : null}
      </div>
      <MapPanel zones={zones} picked={picked} onPick={pick} />
    </div>
  );
}
