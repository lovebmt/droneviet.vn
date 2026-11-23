"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({ name, quantity, onChange }: { name: string; quantity: number; onChange(quantity: number): void }) {
  const btn = "grid h-9 w-9 place-items-center rounded-full hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky disabled:opacity-40";
  return (
    <div className="inline-flex items-center rounded-full border border-line">
      <button type="button" className={btn} aria-label={`Giảm số lượng ${name}`} disabled={quantity <= 1} onClick={() => onChange(quantity - 1)}>
        <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{quantity}</span>
      <button type="button" className={btn} aria-label={`Tăng số lượng ${name}`} disabled={quantity >= 99} onClick={() => onChange(quantity + 1)}>
        <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
