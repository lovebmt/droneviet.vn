import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TAG_LABEL } from "./tags";

/** Tags used by the article sources in content/rd (front matter `tags: [...]`). */
function tagsInContent(): string[] {
  const dirs = readdirSync("content/rd", { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_"));
  return [...new Set(dirs.flatMap((d) => {
    const m = readFileSync(`content/rd/${d.name}/index.md`, "utf8").match(/^tags:\s*\[([^\]]*)\]/m);
    return m ? m[1].split(",").map((t) => t.trim()).filter(Boolean) : [];
  }))];
}

describe("R&D tags", () => {
  it("every tag used by an article has a Vietnamese label", () => {
    const missing = tagsInContent().filter((t) => !TAG_LABEL[t]);
    expect(missing).toEqual([]);
  });
});
