# v2 Plan 5 — Flight Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/bay-mo-phong`: a browser flight trainer with simplified quadcopter physics, Angle/Acro modes, keyboard/gamepad/touch, four missions with score and stars, results saved locally and to the account.
**Architecture:** Pure TypeScript core in `src/sim/` (physics, input, missions, scoring; no Three.js, fully unit-tested). Rendering in `src/components/sim/` with `@react-three/fiber`, loaded only by a dynamic `import()` after the visitor presses "Bắt đầu". No other module imports `three`.
**Tech Stack:** three 0.185, @react-three/fiber 9, @react-three/drei 10, Vitest.
**Spec:** §11, §8.7.

## Global Constraints
- No other page bundles `three` (guard test + build check). Own models only (primitives), not a copy of any existing simulator or game.
- Units: metres, seconds, radians internally; y is up. 60 fps target; auto low-quality when FPS < 40 for 3 s.
- Copy rules from Plan 2. Sun `#FFC531` allowed here.

## Review Focus
1. Huge frame gaps (tab switched) → physics steps in fixed 1/120 s substeps, capped at 0.25 s, no explosion. → Task 1
2. Gamepad with inverted or off-centre throttle → calibration step stores centre/range/invert per axis. → Task 2
3. Signed-out visitor finishes a mission → result saved locally, no API error shown. → Task 4
4. Touch device → two on-screen sticks, no page scroll while flying. → Task 4
5. Another page imports `three` by mistake → guard test fails. → Task 4

---

### Task 1: Physics core
**Files:** `src/sim/{vec.ts,physics.ts}`, `src/sim/physics.test.ts`.
**Produces:** `createDrone(): DroneState`; `stepDrone(state, sticks: Sticks, opts: {mode: "angle"|"acro"; wind?: Vec3}, dt): StepEvents` mutating state (`{crashed, landed, impactSpeed}`); `simulate(state, sticks, opts, frameDt)` with fixed substeps; `Sticks = {throttle 0..1, yaw, pitch, roll -1..1}`; `HOVER_THROTTLE = 0.5`.
- Tests: `hover throttle holds altitude`; `zero throttle falls and rests on the ground`; `angle mode levels itself when sticks are released`; `acro mode keeps its attitude when sticks are released`; `a hard landing is a crash, a soft one is a landing`; `a long frame gap does not explode`. Commit `feat(sim): quadcopter physics core`.

### Task 2: Input
**Files:** `src/sim/{input.ts,input.test.ts}`.
**Produces:** `keyboardSticks(pressed: Set<string>, prev: Sticks, dt)` (W/S throttle, A/D yaw, arrows pitch/roll; throttle holds); `gamepadSticks(axes: number[], cal: Calibration)` with deadzone, invert, centre/range; `defaultCalibration`, `calibrateFromSamples(samples)`; `mergeSticks(...)` (largest magnitude wins).
- Tests: `keyboard raises throttle and it holds`; `gamepad deadzone and invert`; `calibration maps a throttle axis from -0.8..0.9 to 0..1`. Commit `feat(sim): keyboard, gamepad and touch input`.

### Task 3: Missions and scoring
**Files:** `src/sim/{missions.ts,missions.test.ts}`.
**Produces:** `MISSIONS` (cat-canh: hold 2±0.5 m for 10 s; ha-canh: land on pad at (6,0,-6) r=1 m; vong: 5 rings in order; so-8: 8 gates around two posts), `createRun(id)`, `updateRun(run, state, events, dt)`, `scoreRun(run) → {score, stars, timeMs, crashes}`.
- Tests: `hover mission completes after holding altitude`; `rings must be passed in order`; `landing outside the pad does not complete`; `stars drop with time and crashes`. Commit `feat(sim): missions and scoring`.

### Task 4: Scene, page and results
**Files:** `src/app/bay-mo-phong/page.tsx`, `src/components/sim/{sim-launcher.tsx,simulator-app.tsx,scene.tsx,hud.tsx,touch-sticks.tsx,gamepad-setup.tsx,results.ts}`, tests `src/app/bay-mo-phong/sim-page.test.tsx`, `src/sim/no-three-elsewhere.test.ts`.
**Produces:** intro page (missions, controls, "Bắt đầu" per mission) server-rendered; launcher dynamic-imports the app; app runs loop with `useFrame`, HUD (time, altitude, speed, mode, objective), pause/restart, result dialog with stars; `saveResult(result, signedIn)` → localStorage best + `POST /me/sim-results` when signed in (errors ignored); best results shown on intro.
- Tests: `page lists the four missions and does not load the engine until start`; `results are kept locally and posted only when signed in`; `no module outside sim imports three`. Commit `feat(web): flight simulator page`.
