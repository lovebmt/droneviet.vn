import type { Sticks } from "./physics";

/** Keyboard: W/S throttle (holds like a real throttle), A/D yaw, arrows pitch and roll. */
const THROTTLE_RATE = 0.8; // per second while held

export function keyboardSticks(pressed: ReadonlySet<string>, prev: Sticks, dt: number): Sticks {
  const has = (...codes: string[]) => codes.some((c) => pressed.has(c));
  let throttle = prev.throttle;
  if (has("KeyW")) throttle += THROTTLE_RATE * dt;
  if (has("KeyS")) throttle -= THROTTLE_RATE * dt;
  return {
    throttle: Math.min(1, Math.max(0, throttle)),
    yaw: (has("KeyD") ? 1 : 0) - (has("KeyA") ? 1 : 0),
    pitch: (has("ArrowUp") ? 1 : 0) - (has("ArrowDown") ? 1 : 0),
    roll: (has("ArrowRight") ? 1 : 0) - (has("ArrowLeft") ? 1 : 0),
  };
}

export type AxisName = "throttle" | "yaw" | "pitch" | "roll";

export interface AxisCalibration {
  index: number;
  min: number;
  max: number;
  center: number;
  invert: boolean;
}

export interface Calibration {
  deadzone: number;
  axes: Record<AxisName, AxisCalibration>;
}

/** Mode 2 layout of a standard gamepad (left: yaw/throttle, right: roll/pitch); "up" reads as -1. */
export function defaultCalibration(): Calibration {
  return {
    deadzone: 0.06,
    axes: {
      yaw: { index: 0, min: -1, max: 1, center: 0, invert: false },
      throttle: { index: 1, min: -1, max: 1, center: 0, invert: true },
      roll: { index: 2, min: -1, max: 1, center: 0, invert: false },
      pitch: { index: 3, min: -1, max: 1, center: 0, invert: true },
    },
  };
}

/** Samples: moving every stick to its ends, then a final sample with sticks resting at centre. */
export function calibrateFromSamples(samples: number[][], base: Calibration): Calibration {
  const rest = samples[samples.length - 1] ?? [];
  const axes = { ...base.axes };
  for (const name of Object.keys(axes) as AxisName[]) {
    const a = axes[name];
    const values = samples.map((s) => s[a.index]).filter((v): v is number => Number.isFinite(v));
    if (!values.length) continue;
    axes[name] = { ...a, min: Math.min(...values), max: Math.max(...values), center: rest[a.index] ?? 0 };
  }
  return { ...base, axes };
}

function centred(v: number, a: AxisCalibration, deadzone: number): number {
  const span = v >= a.center ? a.max - a.center : a.center - a.min;
  let out = span > 1e-6 ? (v - a.center) / span : 0;
  if (Math.abs(out) < deadzone) out = 0;
  out = Math.max(-1, Math.min(1, out));
  return a.invert ? -out : out;
}

export function gamepadSticks(axesValues: readonly number[], cal: Calibration): Sticks {
  const t = cal.axes.throttle;
  const raw = axesValues[t.index] ?? t.max;
  let throttle = t.max - t.min > 1e-6 ? (raw - t.min) / (t.max - t.min) : 0;
  if (t.invert) throttle = 1 - throttle;
  return {
    throttle: Math.max(0, Math.min(1, throttle)),
    yaw: centred(axesValues[cal.axes.yaw.index] ?? 0, cal.axes.yaw, cal.deadzone),
    pitch: centred(axesValues[cal.axes.pitch.index] ?? 0, cal.axes.pitch, cal.deadzone),
    roll: centred(axesValues[cal.axes.roll.index] ?? 0, cal.axes.roll, cal.deadzone),
  };
}

/** Several devices at once (keyboard + touch + gamepad): the strongest input per axis wins. */
export function mergeSticks(...inputs: Sticks[]): Sticks {
  const pick = (k: keyof Sticks) => inputs.reduce((best, s) => (Math.abs(s[k]) > Math.abs(best) ? s[k] : best), 0);
  return { throttle: pick("throttle"), yaw: pick("yaw"), pitch: pick("pitch"), roll: pick("roll") };
}
