"use client";

import { Canvas } from "@react-three/fiber";
import { Gamepad2, Pause, Play, RotateCcw, Star, Wind, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { type Calibration, gamepadSticks, keyboardSticks, mergeSticks } from "@/sim/input";
import { createRun, findMission, type MissionId, objective, type RunScore, scoreRun, updateRun } from "@/sim/missions";
import { createDrone, type FlightMode, simulate, type Sticks } from "@/sim/physics";
import { type SimResult, saveResult } from "../results";
import { GamepadSetup, loadCalibration } from "./gamepad-setup";
import { SimScene } from "./scene";
import { TouchSticks } from "./touch-sticks";

const IDLE: Sticks = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
const CAPTURED = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

/** Vietnamese decimal comma. */
const dec = (n: number) => n.toFixed(1).replace(".", ",");

type Hud = { time: number; altitude: number; speed: number; objective: string; message: string | null; nextGate: number; gamepad: boolean };

export function SimulatorApp({ missionId, onExit, onResult }: { missionId: MissionId; onExit(): void; onResult(result: SimResult): void }) {
  const mission = findMission(missionId)!;
  const { status } = useSession();
  const drone = useRef(createDrone());
  const run = useRef(createRun(missionId));
  const keys = useRef(new Set<string>());
  const keyboard = useRef<Sticks>(IDLE);
  const touch = useRef<Sticks>(IDLE);
  const calibration = useRef<Calibration | null>(null);
  const rotorSpeed = useRef(0);
  const [mode, setMode] = useState<FlightMode>("angle");
  const [wind, setWind] = useState(false);
  const [paused, setPaused] = useState(false);
  const [setup, setSetup] = useState(false);
  const [result, setResult] = useState<(RunScore & { completed: boolean }) | null>(null);
  const [lowQuality, setLowQuality] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [hud, setHud] = useState<Hud>({ time: 0, altitude: 0, speed: 0, objective: objective(createRun(missionId)), message: null, nextGate: 0, gamepad: false });
  const live = useRef({ mode: "angle" as FlightMode, wind: false, paused: false, done: false, sinceHud: 0, fpsFrames: 0, fpsTime: 0, slowSeconds: 0, clock: 0 });
  useEffect(() => {
    live.current.mode = mode;
    live.current.wind = wind;
    live.current.paused = paused || setup;
  }, [mode, wind, paused, setup]);
  const setTouch = useCallback((patch: Partial<Sticks>) => {
    touch.current = { ...touch.current, ...patch };
  }, []);

  const restart = useCallback(() => {
    drone.current = createDrone();
    run.current = createRun(missionId);
    keyboard.current = IDLE;
    live.current.done = false;
    setResult(null);
    setPaused(false);
  }, [missionId]);

  useEffect(() => {
    calibration.current = loadCalibration();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- device capability, known only in the browser
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const down = (e: KeyboardEvent) => {
      if (CAPTURED.has(e.code)) e.preventDefault();
      if (e.code === "KeyM") setMode((m) => (m === "angle" ? "acro" : "angle"));
      else if (e.code === "KeyP" || e.code === "Escape") setPaused((p) => !p);
      else keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  const tick = useCallback(
    (delta: number) => {
      const l = live.current;
      // Low-quality mode after 3 seconds under 40 fps (spec §11).
      l.fpsFrames += 1;
      l.fpsTime += delta;
      if (l.fpsTime >= 1) {
        l.slowSeconds = l.fpsFrames / l.fpsTime < 40 ? l.slowSeconds + 1 : 0;
        if (l.slowSeconds >= 3) setLowQuality(true);
        l.fpsFrames = 0;
        l.fpsTime = 0;
      }
      if (l.paused || l.done) return;

      keyboard.current = keyboardSticks(keys.current, keyboard.current, delta);
      const pad = typeof navigator !== "undefined" ? navigator.getGamepads?.().find((g) => g) : null;
      const sticks = mergeSticks(keyboard.current, touch.current, pad && calibration.current ? gamepadSticks(pad.axes, calibration.current) : IDLE);
      l.clock += delta;
      const windVec = l.wind ? { x: 1.2 * Math.sin(l.clock * 0.4), y: 0, z: 0.8 * Math.cos(l.clock * 0.25) } : undefined;
      const events = simulate(drone.current, sticks, { mode: l.mode, wind: windVec }, delta);
      updateRun(run.current, drone.current, events, Math.min(delta, 0.25));
      rotorSpeed.current = 10 + sticks.throttle * 60;

      l.sinceHud += delta;
      const finished = run.current.status !== "flying";
      if (l.sinceHud > 0.1 || finished) {
        l.sinceHud = 0;
        const s = drone.current;
        setHud({
          time: run.current.elapsed,
          altitude: s.position.y,
          speed: Math.hypot(s.velocity.x, s.velocity.y, s.velocity.z),
          objective: objective(run.current),
          message: run.current.message,
          nextGate: run.current.nextGate,
          gamepad: !!pad,
        });
      }
      if (finished) {
        l.done = true;
        const score = scoreRun(run.current);
        const completed = run.current.status === "completed";
        setResult({ ...score, completed });
        if (completed) {
          const record = { mission: missionId, ...score };
          void saveResult(record, status === "signed-in").then(() => onResult(record));
        }
      }
    },
    [missionId, onResult, status],
  );

  const chip = "inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur hover:bg-ink";

  return (
    <div role="dialog" aria-modal="true" aria-label={`Bay mô phỏng: ${mission.title}`} className="fixed inset-0 z-[60] bg-sky-50">
      <Canvas dpr={lowQuality ? 1 : [1, 2]} camera={{ position: [0, 2, 4], fov: 60, near: 0.1, far: 200 }} gl={{ antialias: !lowQuality }}>
        <SimScene drone={drone} mission={mission} nextGate={hud.nextGate} tick={tick} lowQuality={lowQuality} rotorSpeed={rotorSpeed} />
      </Canvas>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="rounded-2xl bg-ink/70 px-4 py-3 text-white backdrop-blur">
          <p className="text-sm opacity-80">{mission.title}</p>
          <p className="font-semibold">{hud.objective}</p>
          <p className="mt-1 text-sm tabular-nums opacity-90">
            {dec(hud.time)} giây, cao {dec(hud.altitude)} m, {dec(hud.speed)} m/s
          </p>
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          <button type="button" className={chip} onClick={() => setMode(mode === "angle" ? "acro" : "angle")} aria-label={`Chế độ ${mode === "angle" ? "Angle" : "Acro"}, bấm để đổi`}>
            {mode === "angle" ? "Angle" : "Acro"}
          </button>
          <button type="button" className={`${chip} ${wind ? "bg-sun text-ink hover:bg-sun" : ""}`} onClick={() => setWind(!wind)} aria-pressed={wind}>
            <Wind size={16} strokeWidth={2} aria-hidden="true" /> Gió
          </button>
          <button type="button" className={chip} onClick={() => setSetup(true)}>
            <Gamepad2 size={16} strokeWidth={2} aria-hidden="true" /> {hud.gamepad ? "Tay cầm" : "Kết nối tay cầm"}
          </button>
          <button type="button" className={chip} onClick={() => setPaused(!paused)} aria-label={paused ? "Tiếp tục" : "Tạm dừng"}>
            {paused ? <Play size={16} strokeWidth={2} aria-hidden="true" /> : <Pause size={16} strokeWidth={2} aria-hidden="true" />}
          </button>
          <button type="button" className={chip} onClick={restart} aria-label="Bay lại từ đầu"><RotateCcw size={16} strokeWidth={2} aria-hidden="true" /></button>
          <button type="button" className={chip} onClick={onExit} aria-label="Thoát bay mô phỏng"><X size={16} strokeWidth={2} aria-hidden="true" /></button>
        </div>
      </div>

      {hud.message && !result ? (
        <p role="status" className="pointer-events-none absolute left-1/2 top-28 -translate-x-1/2 rounded-full bg-sun px-4 py-2 text-sm font-semibold text-ink">{hud.message}</p>
      ) : null}

      {isTouch && !result && !setup ? <TouchSticks onChange={setTouch} /> : null}

      {paused && !result && !setup ? (
        <div className="absolute inset-0 grid place-items-center bg-ink/40">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center">
            <p className="text-xl font-semibold">Đang tạm dừng</p>
            <p className="mt-2 text-sm text-muted">W/S lên xuống, A/D xoay, mũi tên tiến lùi và nghiêng. M đổi chế độ, P tạm dừng.</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="sun" onClick={() => setPaused(false)}>Bay tiếp</Button>
              <Button variant="secondary" onClick={onExit}>Thoát</Button>
            </div>
          </div>
        </div>
      ) : null}

      {setup ? (
        <div className="absolute inset-0 grid place-items-center bg-ink/70 p-4 text-white">
          <div className="w-full max-w-lg rounded-2xl bg-ink p-6">
            <GamepadSetup onDone={(cal) => { calibration.current = cal; setSetup(false); }} />
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="absolute inset-0 grid place-items-center bg-ink/50 p-4">
          <div role="alertdialog" aria-label="Kết quả" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <p className="text-2xl font-semibold">{result.completed ? "Hoàn thành" : "Chưa hoàn thành"}</p>
            <p className="mt-3 flex justify-center gap-1" aria-label={`${result.stars} trên 3 sao`}>
              {[0, 1, 2].map((i) => <Star key={i} size={32} strokeWidth={1.5} aria-hidden="true" className={i < result.stars ? "fill-sun text-sun" : "text-line"} />)}
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div><dt className="text-muted">Điểm</dt><dd className="text-lg font-semibold">{result.score}</dd></div>
              <div><dt className="text-muted">Thời gian</dt><dd className="text-lg font-semibold">{dec(result.timeMs / 1000)} giây</dd></div>
              <div><dt className="text-muted">Va chạm</dt><dd className="text-lg font-semibold">{result.crashes}</dd></div>
            </dl>
            {result.completed && status !== "signed-in" ? <p className="mt-3 text-xs text-muted">Kết quả đã lưu trên máy này. Đăng nhập để lưu vào tài khoản.</p> : null}
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="sun" onClick={restart}>Bay lại</Button>
              <Button variant="secondary" onClick={onExit}>Chọn bài khác</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
