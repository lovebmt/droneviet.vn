"use client";

import { useEffect } from "react";
import { useCart } from "@/components/providers/cart-provider";

/** Rendered on the PayOS result page once payment is confirmed. */
export function ClearCart() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
