import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");
const ENGINE = "components/flight-map/engine/";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const staticImports = (code: string) => [...code.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']|^\s*import\s+["']([^"']+)["']/gm)].map((m) => m[1] ?? m[2]);

describe("flight map bundle isolation", () => {
  const all = files(SRC).map((path) => ({ path: relative(SRC, path), code: readFileSync(path, "utf8") }));

  it("no module outside the map engine imports leaflet", () => {
    const offenders = all.filter((f) => !f.path.startsWith(ENGINE) && staticImports(f.code).some((s) => s === "leaflet" || s.startsWith("leaflet/")));
    expect(offenders.map((f) => f.path)).toEqual([]);
  });

  it("nothing outside the map engine statically imports the engine", () => {
    const offenders = all.filter((f) => !f.path.startsWith(ENGINE) && staticImports(f.code).some((s) => s.includes("flight-map/engine")));
    expect(offenders.map((f) => f.path)).toEqual([]);
  });
});
