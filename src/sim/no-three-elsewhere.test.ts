import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");
const ENGINE = "components/sim/engine/";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const staticImports = (code: string) => [...code.matchAll(/^\s*import\s[^;]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);

describe("simulator bundle isolation (spec §11)", () => {
  const all = files(SRC).map((path) => ({ path: relative(SRC, path), code: readFileSync(path, "utf8") }));

  it("no module outside the simulator engine imports three", () => {
    const offenders = all.filter((f) => !f.path.startsWith(ENGINE) && staticImports(f.code).some((s) => s === "three" || s.startsWith("@react-three/")));
    expect(offenders.map((f) => f.path)).toEqual([]);
  });

  it("nothing outside the engine statically imports the engine", () => {
    const offenders = all.filter((f) => !f.path.startsWith(ENGINE) && staticImports(f.code).some((s) => s.includes("sim/engine")));
    expect(offenders.map((f) => f.path)).toEqual([]);
  });
});
