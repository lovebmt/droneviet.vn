import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootIntegrationApp, createUserToken, integrationDatabaseUrl, type IntegrationApp } from "../test/integration-app.js";

describe.skipIf(!integrationDatabaseUrl)("simulator results", () => {
  let ctx: IntegrationApp;
  let pilot: string;

  beforeAll(async () => {
    ctx = await bootIntegrationApp();
    pilot = await createUserToken(ctx);
  }, 60_000);

  afterAll(async () => {
    await ctx?.close();
  });

  const post = (body: unknown, token: string | null = pilot) =>
    fetch(`${ctx.baseUrl}/me/sim-results`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });

  it("sim result rejects stars outside 0-3 and requires a session", async () => {
    expect((await post({ mission: "hover", score: 10, stars: 4, timeMs: 1000, crashes: 0 })).status).toBe(400);
    expect((await post({ mission: "hover", score: 10, stars: -1, timeMs: 1000, crashes: 0 })).status).toBe(400);
    expect((await post({ mission: "hover", score: 10, stars: 1, timeMs: 1000, crashes: 0 }, null)).status).toBe(401);
  });

  it("best result per mission is returned", async () => {
    await post({ mission: "hoops", score: 420, stars: 2, timeMs: 61000, crashes: 1 });
    await post({ mission: "hoops", score: 780, stars: 3, timeMs: 48000, crashes: 0 });
    await post({ mission: "landing", score: 300, stars: 1, timeMs: 20000, crashes: 2 });
    const best = (await (await fetch(`${ctx.baseUrl}/me/sim-results`, { headers: { authorization: `Bearer ${pilot}` } })).json()) as Array<{ mission: string; score: number }>;
    expect(best).toEqual(expect.arrayContaining([
      expect.objectContaining({ mission: "hoops", score: 780, stars: 3 }),
      expect.objectContaining({ mission: "landing", score: 300 }),
    ]));
    expect(best.filter((r) => r.mission === "hoops")).toHaveLength(1);
  });
});
