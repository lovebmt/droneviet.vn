"use client";

import { type PointerEvent, useRef, useState } from "react";
import type { Sticks } from "@/sim/physics";

const SIZE = 132;

/**
 * Two on-screen sticks. Left: vertical is throttle (stays where you leave it, like a real throttle),
 * horizontal is yaw. Right: pitch and roll, springing back to centre. touch-action:none stops scrolling.
 */
function Stick({ label, onMove, sticky }: { label: string; sticky: boolean; onMove(x: number, y: number): void }) {
  const [knob, setKnob] = useState({ x: 0, y: sticky ? 1 : 0 });
  const active = useRef<number | null>(null);

  function update(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    setKnob({ x, y });
    onMove(x, y);
  }

  return (
    <div
      role="presentation"
      aria-label={label}
      className="relative touch-none select-none rounded-full border-2 border-white/70 bg-ink/25 backdrop-blur-sm"
      style={{ width: SIZE, height: SIZE }}
      onPointerDown={(e) => {
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => active.current === e.pointerId && update(e)}
      onPointerUp={() => {
        active.current = null;
        const next = { x: 0, y: sticky ? knob.y : 0 };
        setKnob(next);
        onMove(next.x, next.y);
      }}
    >
      <span className="absolute h-12 w-12 rounded-full bg-white shadow" style={{ left: `calc(${(knob.x + 1) * 50}% - 24px)`, top: `calc(${(knob.y + 1) * 50}% - 24px)` }} />
    </div>
  );
}

export function TouchSticks({ onChange }: { onChange(patch: Partial<Sticks>): void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-between px-6">
      <div className="pointer-events-auto">
        <Stick label="Cần ga và xoay" sticky onMove={(x, y) => onChange({ yaw: x, throttle: (1 - y) / 2 })} />
      </div>
      <div className="pointer-events-auto">
        <Stick label="Cần tiến lùi và nghiêng" sticky={false} onMove={(x, y) => onChange({ roll: x, pitch: -y })} />
      </div>
    </div>
  );
}
