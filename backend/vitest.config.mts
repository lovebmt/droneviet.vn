import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    // Integration specs share one Postgres database; run files one at a time.
    fileParallelism: false,
  },
});
