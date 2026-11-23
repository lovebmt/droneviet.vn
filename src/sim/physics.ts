/**
 * Simplified quadcopter physics, written for this trainer (spec §11): thrust along the body's up
 * axis, gravity, linear drag (with optional wind) and first-order rotational inertia.
 * Angle mode self-levels; Acro mode holds attitude. Metres, seconds, radians; y is up, forward is -z.
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Sticks {
  /** 0..1, HOVER_THROTTLE holds altitude when level. */
  throttle: number;
  /** -1..1, right turns right. */
  yaw: number;
  /** -1..1, forward (positive) tilts the nose down and flies forward. */
  pitch: number;
  /** -1..1, right (positive) banks right. */
  roll: number;
}

export interface DroneState {
  position: Vec3;
  velocity: Vec3;
  attitude: { roll: number; pitch: number; yaw: number };
  rates: { roll: number; pitch: number; yaw: number };
  airborne: boolean;
}

export type FlightMode = "angle" | "acro";

export interface StepEvents {
  crashed: boolean;
  landed: boolean;
  impactSpeed: number;
}

export const GRAVITY = 9.81;
export const HOVER_THROTTLE = 0.5;
const MAX_THRUST = GRAVITY / HOVER_THROTTLE;
const DRAG = 0.35;
const MAX_ANGLE = 0.5; // ~29° in angle mode
const MAX_RATE = 3.5; // rad/s in acro mode
const ACRO_LIMIT = 1.4; // no flips: keeps Euler angles well-defined
const YAW_RATE = 2.2;
const LEVEL_GAIN = 6;
const RESPONSE = 18; // 1/s, rotational inertia
const CRASH_SPEED = 3;
const SUBSTEP = 1 / 120;
const MAX_FRAME = 0.25;

export function createDrone(): DroneState {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    attitude: { roll: 0, pitch: 0, yaw: 0 },
    rates: { roll: 0, pitch: 0, yaw: 0 },
    airborne: false,
  };
}

/** World-space direction of the body's up axis (thrust direction). */
export function bodyUp(a: DroneState["attitude"]): Vec3 {
  const x = Math.sin(a.roll);
  const y = Math.cos(a.roll) * Math.cos(a.pitch);
  const z = -Math.cos(a.roll) * Math.sin(a.pitch);
  const cy = Math.cos(a.yaw);
  const sy = Math.sin(a.yaw);
  return { x: x * cy + z * sy, y, z: -x * sy + z * cy };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** One fixed physics step. Mutates `s`. */
export function stepDrone(s: DroneState, input: Sticks, opts: { mode: FlightMode; wind?: Vec3 }, dt: number): StepEvents {
  const events: StepEvents = { crashed: false, landed: false, impactSpeed: 0 };
  const sticks = { throttle: clamp(input.throttle, 0, 1), yaw: clamp(input.yaw, -1, 1), pitch: clamp(input.pitch, -1, 1), roll: clamp(input.roll, -1, 1) };
  if (s.position.y > 0.05) s.airborne = true;

  // Rate commands, then first-order response (inertia).
  const cmd =
    opts.mode === "angle"
      ? { roll: LEVEL_GAIN * (sticks.roll * MAX_ANGLE - s.attitude.roll), pitch: LEVEL_GAIN * (sticks.pitch * MAX_ANGLE - s.attitude.pitch) }
      : { roll: sticks.roll * MAX_RATE, pitch: sticks.pitch * MAX_RATE };
  const k = Math.min(1, dt * RESPONSE);
  s.rates.roll += (cmd.roll - s.rates.roll) * k;
  s.rates.pitch += (cmd.pitch - s.rates.pitch) * k;
  s.rates.yaw += (-sticks.yaw * YAW_RATE - s.rates.yaw) * k;
  s.attitude.roll += s.rates.roll * dt;
  s.attitude.pitch += s.rates.pitch * dt;
  s.attitude.yaw += s.rates.yaw * dt;
  if (opts.mode === "acro") {
    s.attitude.roll = clamp(s.attitude.roll, -ACRO_LIMIT, ACRO_LIMIT);
    s.attitude.pitch = clamp(s.attitude.pitch, -ACRO_LIMIT, ACRO_LIMIT);
  }

  // Forces → acceleration (unit mass).
  const up = bodyUp(s.attitude);
  const thrust = sticks.throttle * MAX_THRUST;
  const wind = opts.wind ?? { x: 0, y: 0, z: 0 };
  const ax = up.x * thrust - DRAG * (s.velocity.x - wind.x);
  const ay = up.y * thrust - GRAVITY - DRAG * (s.velocity.y - wind.y);
  const az = up.z * thrust - DRAG * (s.velocity.z - wind.z);
  s.velocity.x += ax * dt;
  s.velocity.y += ay * dt;
  s.velocity.z += az * dt;
  s.position.x += s.velocity.x * dt;
  s.position.y += s.velocity.y * dt;
  s.position.z += s.velocity.z * dt;

  // Ground contact.
  if (s.position.y <= 0) {
    const impact = Math.max(0, -s.velocity.y);
    s.position.y = 0;
    if (s.velocity.y < 0) s.velocity.y = 0;
    s.velocity.x *= 0.8;
    s.velocity.z *= 0.8;
    if (s.airborne) {
      events.impactSpeed = impact;
      if (impact > CRASH_SPEED) events.crashed = true;
      else events.landed = true;
      s.airborne = false;
    }
    if (!s.airborne && thrust * up.y < GRAVITY) {
      // Resting on the ground: skids keep it level.
      s.attitude.roll *= 0.8;
      s.attitude.pitch *= 0.8;
      s.rates.roll = 0;
      s.rates.pitch = 0;
    }
  }
  return events;
}

/** Advances one rendered frame in fixed substeps; long gaps (tab switches) are capped. */
export function simulate(s: DroneState, sticks: Sticks, opts: { mode: FlightMode; wind?: Vec3 }, frameDt: number): StepEvents {
  const total: StepEvents = { crashed: false, landed: false, impactSpeed: 0 };
  let remaining = Math.min(Math.max(frameDt, 0), MAX_FRAME);
  while (remaining > 1e-9) {
    const dt = Math.min(SUBSTEP, remaining);
    const e = stepDrone(s, sticks, opts, dt);
    total.crashed ||= e.crashed;
    total.landed ||= e.landed;
    total.impactSpeed = Math.max(total.impactSpeed, e.impactSpeed);
    remaining -= dt;
  }
  return total;
}
