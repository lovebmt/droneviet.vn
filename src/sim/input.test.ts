import { describe, expect, it } from "vitest";
import { calibrateFromSamples, defaultCalibration, gamepadSticks, isBoost, keyboardSticks, mergeSticks } from "./input";
import { createDrone, type DroneState, HOVER_THROTTLE, simulate, type Sticks } from "./physics";

const idle: Sticks = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };

/** One keyboard frame in angle mode: read keys, then step the physics. */
function fly(drone: DroneState, prev: Sticks, keys: string[]): Sticks {
  const pressed = new Set(keys);
  const s = keyboardSticks(pressed, prev, 1 / 60, drone, "angle");
  simulate(drone, s, { mode: "angle", boost: isBoost(pressed) }, 1 / 60);
  return s;
}

describe("input", () => {
  it("angle mode: a short tap on W climbs a little and releasing holds that altitude", () => {
    const drone = createDrone();
    let s = idle;
    for (let i = 0; i < 0.4 * 60; i++) s = fly(drone, s, ["KeyW"]);
    for (let i = 0; i < 2 * 60; i++) s = fly(drone, s, []);
    const settled = drone.position.y;
    expect(settled).toBeGreaterThan(0.8);
    expect(settled).toBeLessThan(2.5);
    for (let i = 0; i < 5 * 60; i++) s = fly(drone, s, []);
    expect(Math.abs(drone.position.y - settled)).toBeLessThan(0.2);
  });

  it("angle mode: flying forward at full tilt keeps altitude", () => {
    const drone = createDrone();
    drone.position.y = 3;
    drone.airborne = true;
    let s: Sticks = { ...idle, throttle: HOVER_THROTTLE };
    for (let i = 0; i < 3 * 60; i++) s = fly(drone, s, ["ArrowUp", "ArrowRight", "KeyD"]);
    expect(s).toMatchObject({ pitch: 1, roll: 1, yaw: 1 });
    expect(drone.velocity.z).toBeLessThan(-1);
    expect(Math.abs(drone.position.y - 3)).toBeLessThan(0.5);
  });

  it("angle mode: motors idle on the ground until W is pressed", () => {
    expect(keyboardSticks(new Set(), idle, 1 / 60, createDrone(), "angle").throttle).toBe(0);
  });

  it("Shift climbs faster", () => {
    const climb = (keys: string[]) => {
      const drone = createDrone();
      let s = idle;
      for (let i = 0; i < 60; i++) s = fly(drone, s, keys);
      return drone.position.y;
    };
    expect(climb(["KeyW", "ShiftLeft"])).toBeGreaterThan(climb(["KeyW"]) * 1.5);
  });

  it("acro mode: W and S move the throttle and it stays where it was left", () => {
    const drone = createDrone();
    let s = idle;
    for (let i = 0; i < 60; i++) s = keyboardSticks(new Set(["KeyW"]), s, 1 / 60, drone, "acro");
    const raised = s.throttle;
    expect(raised).toBeGreaterThan(0.4);
    for (let i = 0; i < 60; i++) s = keyboardSticks(new Set(), s, 1 / 60, drone, "acro");
    expect(s.throttle).toBe(raised);
    for (let i = 0; i < 30; i++) s = keyboardSticks(new Set(["KeyS"]), s, 1 / 60, drone, "acro");
    expect(s.throttle).toBeLessThan(raised);
  });

  it("gamepad deadzone and invert", () => {
    const cal = defaultCalibration();
    // Mode 2: left stick x=yaw (0), y=throttle (1, up is -1); right stick x=roll (2), y=pitch (3, up is -1)
    const s = gamepadSticks([0.03, -1, 0.5, -0.5], cal);
    expect(s.yaw).toBe(0);
    expect(s.throttle).toBeCloseTo(1);
    expect(s.roll).toBeGreaterThan(0.4);
    expect(s.pitch).toBeGreaterThan(0.4);
    const inverted = { ...cal, axes: { ...cal.axes, roll: { ...cal.axes.roll, invert: true } } };
    expect(gamepadSticks([0, 0, 0.5, 0], inverted).roll).toBeLessThan(-0.4);
  });

  it("calibration maps a throttle axis from -0.8..0.9 to 0..1", () => {
    const samples = [
      [0, 0.9, 0, 0],
      [0, -0.8, 0, 0],
      [0.02, 0.1, -0.01, 0.01],
    ];
    const cal = calibrateFromSamples(samples, defaultCalibration());
    expect(gamepadSticks([0, -0.8, 0, 0], cal).throttle).toBeCloseTo(1, 2);
    expect(gamepadSticks([0, 0.9, 0, 0], cal).throttle).toBeCloseTo(0, 2);
  });

  it("merge keeps the strongest input per axis and takes throttle from the device in charge", () => {
    expect(mergeSticks([{ ...idle, roll: 0.2, throttle: 0.5 }, { ...idle, roll: -0.8, throttle: 0.3 }], 1)).toEqual({ throttle: 0.3, yaw: 0, pitch: 0, roll: -0.8 });
  });

  it("holding S from 3 m lands without crashing", () => {
    const drone = createDrone();
    drone.position.y = 3;
    drone.airborne = true;
    let s: Sticks = { ...idle, throttle: HOVER_THROTTLE };
    let crashes = 0;
    for (let i = 0; i < 10 * 60; i++) {
      s = keyboardSticks(new Set(["KeyS"]), s, 1 / 60, drone, "angle");
      crashes += simulate(drone, s, { mode: "angle" }, 1 / 60).crashed ? 1 : 0;
    }
    expect(drone.position.y).toBe(0);
    expect(crashes).toBe(0);
  });
});
