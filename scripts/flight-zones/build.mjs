#!/usr/bin/env node
// Builds public/geo/flight-zones.json from public data, following Quyết định 18/2020/QĐ-TTg:
// - airports: runways from OpenStreetMap (ODbL) → no-fly rectangle (Điều 3 khoản 4) and the restricted ring (Điều 4 khoản 4);
// - borders: Natural Earth land boundaries, Vietnam point of view (public domain) → 25 km China, 10 km Laos/Cambodia (Điều 4 khoản 3).
// Military sites, offices and crowds (Điều 3 khoản 1–3, Điều 4 khoản 2) have no public data and are not drawn.
// Usage: npm run zones:build   (downloads are cached in $ZONES_CACHE or the OS temp dir)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buffer, distance, featureCollection, intersect, point, simplify, truncate } from "@turf/turf";
import { airportRectangles } from "./geometry.mjs";

const OUT = new URL("../../public/geo/flight-zones.json", import.meta.url);
const CACHE = process.env.ZONES_CACHE ?? join(tmpdir(), "droneviet-flight-zones");
const AGENT = "flight-zone-builder/1.0";
const NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const OVERPASS = "https://overpass-api.de/api/interpreter";
const QUERY = `[out:json][timeout:120];area["ISO3166-1"="VN"][admin_level=2]->.vn;(way["aeroway"="runway"](area.vn););out geom tags;(nwr["aeroway"="aerodrome"](area.vn););out center tags;`;
const MIN_RUNWAY_M = 1000;
/** East of this longitude (Hoàng Sa, Trường Sa) only runways of Vietnamese aerodromes (ICAO "VV…") are kept. */
const OFFSHORE_LON = 110;
const BORDER_KM = { China: 25, Laos: 10, Cambodia: 10 };
const NEIGHBOUR_VI = { China: "Trung Quốc", Laos: "Lào", Cambodia: "Campuchia" };

async function cached(name, load) {
  const path = join(CACHE, name);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    const data = await load();
    await mkdir(CACHE, { recursive: true });
    await writeFile(path, JSON.stringify(data));
    return data;
  }
}

async function get(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { "user-agent": AGENT, ...init.headers } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

const lengthM = (coords) => coords.slice(1).reduce((sum, c, i) => sum + distance(point(coords[i]), point(c), { units: "meters" }), 0);

function airports(osm) {
  const aerodromes = osm.elements
    .filter((e) => e.tags?.aeroway === "aerodrome")
    .map((e) => ({ name: e.tags["name:vi"] ?? e.tags.name ?? "Sân bay", icao: e.tags.icao ?? null, at: e.center ? [e.center.lon, e.center.lat] : [e.lon, e.lat] }));
  const runways = osm.elements
    .filter((e) => e.tags?.aeroway === "runway" && e.geometry?.length >= 2 && !e.tags.disused && !e.tags.abandoned)
    .map((e) => e.geometry.map((g) => [g.lon, g.lat]))
    .filter((coords) => lengthM(coords) >= MIN_RUNWAY_M)
    .map((coords) => ({ ends: [coords[0], coords[coords.length - 1]] }));

  // Each runway belongs to the nearest aerodrome within 5 km; others form their own group.
  const groups = new Map();
  for (const runway of runways) {
    const mid = [(runway.ends[0][0] + runway.ends[1][0]) / 2, (runway.ends[0][1] + runway.ends[1][1]) / 2];
    const near = aerodromes
      .map((a) => ({ a, d: distance(point(mid), point(a.at)) }))
      .filter((x) => x.d <= 5)
      .sort((x, y) => x.d - y.d)[0]?.a;
    if (mid[0] >= OFFSHORE_LON && !near?.icao?.startsWith("VV")) continue;
    const key = near ? near.name : `${mid[0].toFixed(2)},${mid[1].toFixed(2)}`;
    if (!groups.has(key)) groups.set(key, { name: near?.name ?? "Đường cất hạ cánh (chưa có tên trên OpenStreetMap)", runways: [] });
    groups.get(key).runways.push(runway);
  }
  return [...groups.values()];
}

const compact = (feature, tolerance) => truncate(simplify(feature, { tolerance, highQuality: true }), { precision: 4, coordinates: 2 });

async function main() {
  const [osm, countries, lines] = await Promise.all([
    cached("osm-runways.json", () => get(OVERPASS, { method: "POST", body: new URLSearchParams({ data: QUERY }) })),
    cached("ne-countries-vnm.json", () => get(`${NE}/ne_10m_admin_0_countries_vnm.geojson`)),
    cached("ne-boundary-lines.json", () => get(`${NE}/ne_10m_admin_0_boundary_lines_land.geojson`)),
  ]);

  const features = [];
  for (const airport of airports(osm)) {
    const { cam, hanChe } = airportRectangles(airport.runways);
    features.push({ ...compact(cam, 0.0005), properties: { kind: "cam", category: "san-bay", name: airport.name, rule: "QĐ 18/2020/QĐ-TTg, Điều 3 khoản 4" } });
    if (hanChe) features.push({ ...compact(hanChe, 0.0005), properties: { kind: "han-che", category: "san-bay-tiep-giap", name: airport.name, rule: "QĐ 18/2020/QĐ-TTg, Điều 4 khoản 4" } });
  }

  const vietnam = simplify(countries.features.find((f) => f.properties.ADMIN === "Vietnam"), { tolerance: 0.005, highQuality: true });
  for (const line of lines.features) {
    const sides = [line.properties.ADM0_LEFT, line.properties.ADM0_RIGHT];
    if (!sides.includes("Vietnam")) continue;
    const neighbour = sides.find((s) => s !== "Vietnam");
    const km = BORDER_KM[neighbour];
    if (!km) continue;
    const band = intersect(featureCollection([buffer(line, km, { units: "kilometers" }), vietnam]));
    if (!band) continue;
    features.push({
      ...compact(band, 0.003),
      properties: { kind: "han-che", category: "bien-gioi", name: `Biên giới Việt Nam, ${NEIGHBOUR_VI[neighbour]} (${km} km)`, rule: `QĐ 18/2020/QĐ-TTg, Điều 4 khoản 3 điểm ${neighbour === "China" ? "a" : "b"}` },
    });
  }

  const collection = {
    type: "FeatureCollection",
    metadata: {
      builtAt: new Date().toISOString().slice(0, 10),
      sources: [
        "Quyết định 18/2020/QĐ-TTg (quy tắc vùng cấm, hạn chế bay)",
        "Đường cất hạ cánh: © OpenStreetMap contributors, ODbL",
        "Đường biên giới: Natural Earth (public domain), quan điểm Việt Nam",
      ],
    },
    features,
  };
  await mkdir(new URL(".", OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(collection));
  const count = (category) => features.filter((f) => f.properties.category === category).length;
  console.log(`${count("san-bay")} sân bay, ${count("bien-gioi")} dải biên giới, ${(JSON.stringify(collection).length / 1024).toFixed(0)} KB → public/geo/flight-zones.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
