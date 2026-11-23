import { describe, expect, it } from "vitest";
import { createDrone, HOVER_THROTTLE, simulate, type Sticks } from "./physics";

const sticks = (s: Partial<Sticks> = {}): Sticks => ({ throttle: 0, yaw: 0, pitch: 0, roll: 0, ...s });
const run = (seconds: number, fn: (t: number) => Sticks, mode: "angle" | "acro" = "angle", start = createDrone()) => {
  const events = { crashes: 0, landings: 0 };
  for (let t = 0; t < seconds; t += 1 / 60) {
    const e = simulate(start, fn(t), { mode }, 1 / 60);
    events.crashes += e.crashed ? 1 : 0;
    events.landings += e.landed ? 1 : 0;
  }
  return { drone: start, events };
};

describe("physics", () => {
  it("hover throttle holds altitude", () => {
    const drone = createDrone();
    drone.position.y = 2;
    run(5, () => sticks({ throttle: HOVER_THROTTLE }), "angle", drone);
    expect(drone.position.y).toBeGreaterThan(1.5);
    expect(drone.position.y).toBeLessThan(2.5);
  });

  it("zero throttle falls and rests on the ground", () => {
    const drone = createDrone();
    drone.position.y = 0.3;
    run(3, () => sticks(), "angle", drone);
    expect(drone.position.y).toBe(0);
    expect(Math.abs(drone.velocity.y)).toBe(0);
  });

  it("climbs with more than hover throttle", () => {
    const { drone } = run(2, () => sticks({ throttle: 0.8 }));
    expect(drone.position.y).toBeGreaterThan(2);
  });

  it("angle mode moves forward on pitch and levels itself when sticks are released", () => {
    const drone = createDrone();
    drone.position.y = 3;
    run(1.5, () => sticks({ throttle: HOVER_THROTTLE, pitch: 1 }), "angle", drone);
    expect(drone.velocity.z).toBeLessThan(-1); // forward is -z
    run(2, () => sticks({ throttle: HOVER_THROTTLE }), "angle", drone);
    expect(Math.abs(drone.attitude.pitch)).toBeLessThan(0.05);
    expect(Math.abs(drone.attitude.roll)).toBeLessThan(0.05);
  });

  it("acro mode keeps its attitude when sticks are released", () => {
    const drone = createDrone();
    drone.position.y = 20;
    run(0.2, () => sticks({ throttle: HOVER_THROTTLE, roll: 1 }), "acro", drone);
    run(0.3, () => sticks({ throttle: HOVER_THROTTLE }), "acro", drone); // rotational inertia settles
    const rolled = drone.attitude.roll;
    expect(Math.abs(rolled)).toBeGreaterThan(0.3);
    run(0.5, () => sticks({ throttle: HOVER_THROTTLE }), "acro", drone);
    expect(drone.attitude.roll).toBeCloseTo(rolled, 2);
  });

  it("a hard landing is a crash, a soft one is a landing", () => {
    const hard = createDrone();
    hard.position.y = 6;
    expect(run(3, () => sticks(), "angle", hard).events.crashes).toBe(1);

    const soft = createDrone();
    soft.position.y = 1;
    const { events } = run(6, (t) => sticks({ throttle: t < 4 ? HOVER_THROTTLE - 0.06 : 0 }), "angle", soft);
    expect(events.crashes).toBe(0);
    expect(events.landings).toBe(1);
  });

  it("a long frame gap does not explode", () => {
    const drone = createDrone();
    drone.position.y = 2;
    simulate(drone, sticks({ throttle: HOVER_THROTTLE }), { mode: "angle" }, 5);
    for (const v of [drone.position.x, drone.position.y, drone.position.z, drone.velocity.y]) expect(Number.isFinite(v)).toBe(true);
    expect(drone.position.y).toBeGreaterThan(1);
  });
});
