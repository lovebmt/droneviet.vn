import { describe, expect, it } from "vitest";
import { calibrateFromSamples, defaultCalibration, gamepadSticks, keyboardSticks, mergeSticks } from "./input";
import { createDrone, HOVER_THROTTLE, simulate, type Sticks } from "./physics";

const idle: Sticks = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };

describe("input", () => {
  it("keyboard W climbs, S descends and releasing returns to hover", () => {
    let s = idle;
    for (let i = 0; i < 60; i++) s = keyboardSticks(new Set(["KeyW"]), s, 1 / 60);
    expect(s.throttle).toBeGreaterThan(HOVER_THROTTLE + 0.2);
    for (let i = 0; i < 60; i++) s = keyboardSticks(new Set(), s, 1 / 60);
    expect(s.throttle).toBeCloseTo(HOVER_THROTTLE, 2);
    for (let i = 0; i < 60; i++) s = keyboardSticks(new Set(["KeyS"]), s, 1 / 60);
    expect(s.throttle).toBeLessThan(HOVER_THROTTLE);
    expect(s.throttle).toBeGreaterThan(HOVER_THROTTLE - 0.15);
    expect(keyboardSticks(new Set(["ArrowUp", "ArrowRight", "KeyD"]), s, 1 / 60)).toMatchObject({ pitch: 1, roll: 1, yaw: 1 });
    expect(keyboardSticks(new Set(), s, 1 / 60)).toMatchObject({ pitch: 0, roll: 0, yaw: 0 });
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

  it("merge keeps the strongest input per axis", () => {
    expect(mergeSticks({ ...idle, roll: 0.2, throttle: 0.5 }, { ...idle, roll: -0.8, throttle: 0.3 })).toEqual({ throttle: 0.5, yaw: 0, pitch: 0, roll: -0.8 });
  });

  it("holding S from 3 m lands without crashing", () => {
    const drone = createDrone();
    drone.position.y = 3;
    let s: Sticks = { ...idle, throttle: HOVER_THROTTLE };
    let crashes = 0;
    for (let i = 0; i < 10 * 60; i++) {
      s = keyboardSticks(new Set(["KeyS"]), s, 1 / 60);
      crashes += simulate(drone, s, { mode: "angle" }, 1 / 60).crashed ? 1 : 0;
    }
    expect(drone.position.y).toBe(0);
    expect(crashes).toBe(0);
  });
});
