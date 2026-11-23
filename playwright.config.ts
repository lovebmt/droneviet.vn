import { defineConfig, devices } from "@playwright/test";

/** Runs against already-running servers (web :3000, API :4000) or E2E_BASE_URL. */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] } } }],
});
