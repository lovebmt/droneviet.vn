import type { Metadata } from "next";
import { CartView } from "@/components/checkout/cart-view";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Giỏ hàng", robots: { index: false } };

export default function CartPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-4xl font-light tracking-tight">Giỏ hàng</h1>
      <div className="mt-8"><CartView /></div>
    </Container>
  );
}
