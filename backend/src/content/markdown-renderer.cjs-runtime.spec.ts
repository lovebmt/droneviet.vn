import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vercel's Node runtime cannot require() ES modules. Compile the service to CommonJS
// (as `nest build` does) and render with require(esm) disabled.
describe("MarkdownRendererService in a CommonJS runtime without require(esm)", () => {
  it("renders markdown and headings", () => {
    const script = `
      const { MarkdownRendererService } = require("./src/content/markdown-renderer.service.ts");
      new MarkdownRendererService().render("# Xin chào\\n\\nBody").then((r) => {
        process.stdout.write(JSON.stringify(r));
      });
    `;

    const output = execFileSync(
      process.execPath,
      ["--no-experimental-require-module", "-r", "ts-node/register/transpile-only", "-e", script],
      { cwd: resolve(__dirname, "../.."), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );

    const rendered = JSON.parse(output) as { html: string; tableOfContents: { text: string }[] };
    expect(rendered.html).toContain("<h1");
    expect(rendered.tableOfContents).toEqual([
      expect.objectContaining({ depth: 1, text: "Xin chào" }),
    ]);
  }, 30_000);
});
