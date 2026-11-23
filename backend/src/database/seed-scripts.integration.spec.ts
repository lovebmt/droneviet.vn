import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { integrationDatabaseUrl } from "../test/integration-app.js";

// vercel-build runs these exact commands when RUN_SEED=1; they must work under ts-node.
describe.skipIf(!integrationDatabaseUrl)("seed scripts run the way vercel-build runs them", () => {
  it("npx ts-node src/database/seed-v2.ts exits cleanly", () => {
    const run = () =>
      execFileSync("npx", ["ts-node", "src/database/seed-v2.ts"], {
        cwd: resolve(__dirname, "../.."),
        env: { ...process.env, DATABASE_URL: integrationDatabaseUrl },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    expect(run).not.toThrow();
  }, 60_000);
});
