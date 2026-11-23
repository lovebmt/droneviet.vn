import { describe, expect, it } from "vitest";
import { createRun, MISSIONS, scoreRun, updateRun } from "./missions";
import { createDrone, type DroneState, type StepEvents } from "./physics";

const none: StepEvents = { crashed: false, landed: false, impactSpeed: 0 };
const at = (x: number, y: number, z: number): DroneState => ({ ...createDrone(), position: { x, y, z }, airborne: y > 0.05 });

describe("missions", () => {
  it("has the four missions", () => {
    expect(MISSIONS.map((m) => m.id)).toEqual(["cat-canh", "ha-canh", "vong", "so-8"]);
  });

  it("hover mission completes after holding altitude", () => {
    const run = createRun("cat-canh");
    for (let i = 0; i < 9 * 60; i++) updateRun(run, at(0, 2.2, 0), none, 1 / 60);
    expect(run.status).toBe("flying");
    for (let i = 0; i < 2 * 60; i++) updateRun(run, at(0, 3.5, 0), none, 1 / 60); // too high: no progress
    expect(run.status).toBe("flying");
    for (let i = 0; i < 61; i++) updateRun(run, at(0, 1.8, 0), none, 1 / 60);
    expect(run.status).toBe("completed");
  });

  it("rings must be passed in order", () => {
    const run = createRun("vong");
    const gates = MISSIONS.find((m) => m.id === "vong")!.gates!;
    updateRun(run, at(gates[1].x, gates[1].y, gates[1].z), none, 0.1);
    expect(run.nextGate).toBe(0);
    for (const g of gates) updateRun(run, at(g.x, g.y, g.z), none, 0.1);
    expect(run.status).toBe("completed");
  });

  it("landing outside the pad does not complete", () => {
    const run = createRun("ha-canh");
    updateRun(run, at(0, 2, 0), none, 1);
    updateRun(run, at(0, 0, 0), { crashed: false, landed: true, impactSpeed: 0.5 }, 0.1);
    expect(run.status).toBe("flying");
    expect(run.message).toMatch(/ngoài ô/);
    updateRun(run, at(6, 2, -6), none, 1);
    updateRun(run, at(6.3, 0, -6), { crashed: false, landed: true, impactSpeed: 0.5 }, 0.1);
    expect(run.status).toBe("completed");
  });

  it("a crash is counted and the time limit fails the run", () => {
    const run = createRun("cat-canh");
    updateRun(run, at(0, 0, 0), { crashed: true, landed: false, impactSpeed: 6 }, 0.1);
    expect(run.crashes).toBe(1);
    updateRun(run, at(0, 0, 0), none, 120);
    expect(run.status).toBe("failed");
    expect(scoreRun(run).stars).toBe(0);
  });

  it("stars drop with time and crashes", () => {
    const fast = createRun("cat-canh");
    fast.status = "completed";
    fast.elapsed = 12;
    const slow = { ...fast, elapsed: 40 };
    const crashed = { ...fast, crashes: 2 };
    expect(scoreRun(fast).stars).toBe(3);
    expect(scoreRun(slow).stars).toBeLessThan(3);
    expect(scoreRun(crashed).stars).toBeLessThan(3);
    expect(scoreRun(fast).score).toBeGreaterThan(scoreRun(slow).score);
    expect(scoreRun(fast)).toMatchObject({ timeMs: 12_000, crashes: 0 });
  });
});
