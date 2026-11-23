"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { type AxisName, type Calibration, calibrateFromSamples, defaultCalibration } from "@/sim/input";

const KEY = "dv-sim-gamepad";
const AXES: Array<{ name: AxisName; label: string }> = [
  { name: "throttle", label: "Ga" },
  { name: "yaw", label: "Xoay" },
  { name: "pitch", label: "Tiến lùi" },
  { name: "roll", label: "Nghiêng" },
];

export function loadCalibration(): Calibration {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Calibration | null;
    return saved?.axes ? saved : defaultCalibration();
  } catch {
    return defaultCalibration();
  }
}

/** Two steps: move every stick to its ends, then let go and confirm; the rest position becomes centre. */
export function GamepadSetup({ onDone }: { onDone(cal: Calibration): void }) {
  const [cal, setCal] = useState<Calibration>(loadCalibration);
  const samples = useRef<number[][]>([]);
  const [step, setStep] = useState<"sweep" | "release">("sweep");
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState<number[]>([]);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      const pad = navigator.getGamepads?.().find((g) => g);
      setConnected(!!pad);
      if (pad) {
        const axes = [...pad.axes];
        setLive(axes);
        if (step === "sweep") samples.current.push(axes);
      }
      frame = requestAnimationFrame(read);
    };
    frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  function finish() {
    const next = calibrateFromSamples([...samples.current, live], cal);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // keep for this session only
    }
    onDone(next);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Hiệu chỉnh tay cầm</h2>
      {!connected ? <p className="text-muted">Cắm tay cầm hoặc bộ điều khiển RC rồi bấm một nút bất kỳ để trình duyệt nhận thiết bị.</p> : null}
      {step === "sweep" ? (
        <p>Bước 1: đẩy mỗi cần lên, xuống, trái, phải hết cỡ vài lần.</p>
      ) : (
        <p>Bước 2: thả tay khỏi các cần (cần ga để thấp nhất), rồi bấm “Xong”.</p>
      )}
      <ul className="grid grid-cols-2 gap-3 text-sm">
        {AXES.map(({ name, label }) => (
          <li key={name} className="rounded-xl bg-white/10 p-3">
            <label className="flex items-center justify-between gap-2">
              <span>{label}: trục</span>
              <select value={cal.axes[name].index} onChange={(e) => setCal({ ...cal, axes: { ...cal.axes, [name]: { ...cal.axes[name], index: Number(e.target.value) } } })} className="rounded bg-white px-2 py-1 text-ink">
                {Array.from({ length: Math.max(4, live.length) }, (_, i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" checked={cal.axes[name].invert} onChange={(e) => setCal({ ...cal, axes: { ...cal.axes, [name]: { ...cal.axes[name], invert: e.target.checked } } })} /> Đảo chiều
            </label>
            <span className="mt-2 block h-1.5 rounded bg-white/20">
              <span className="block h-1.5 rounded bg-sun" style={{ width: `${(((live[cal.axes[name].index] ?? 0) + 1) / 2) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        {step === "sweep" ? <Button variant="sun" onClick={() => setStep("release")}>Tiếp tục</Button> : <Button variant="sun" onClick={finish}>Xong</Button>}
        <Button variant="ghost" className="text-white" onClick={() => onDone(cal)}>Bỏ qua</Button>
      </div>
    </div>
  );
}
