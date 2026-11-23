"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  variantId: string;
  slug: string;
  name: string;
  priceVnd: number;
  quantity: number;
  imageUrl: string | null;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  totalVnd: number;
  /** False until the saved cart has been read, so pages don't flash "empty". */
  ready: boolean;
  add(line: CartLine): void;
  setQuantity(variantId: string, quantity: number): void;
  remove(variantId: string): void;
  clear(): void;
}

const STORAGE_KEY = "dv-cart-v2";
const CartContext = createContext<CartValue | null>(null);

/** Reads the saved cart; private mode, blocked storage or bad JSON all mean "empty". */
function readSaved(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((l): l is CartLine => typeof l?.variantId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

function save(lines: CartLine[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // storage unavailable: the cart still works for this visit
  }
}

/** Client-side cart; prices and stock are re-checked by the API at checkout (spec §9.2). */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Restore after mount so server and first client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(readSaved());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) save(lines);
  }, [lines, loaded]);

  const add = useCallback((line: CartLine) => {
    setLines((current) => {
      const existing = current.find((l) => l.variantId === line.variantId);
      return existing
        ? current.map((l) => (l.variantId === line.variantId ? { ...l, quantity: l.quantity + line.quantity } : l))
        : [...current, line];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0 ? current.filter((l) => l.variantId !== variantId) : current.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((variantId: string) => setLines((current) => current.filter((l) => l.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      totalVnd: lines.reduce((sum, l) => sum + l.quantity * l.priceVnd, 0),
      ready: loaded,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, loaded, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
