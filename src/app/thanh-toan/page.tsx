import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Breadcrumbs } from "@/components/page/breadcrumbs";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Đặt hàng", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Giỏ hàng", href: "/gio-hang" }, { label: "Đặt hàng" }]} />
      <h1 className="mt-3 text-4xl font-light tracking-tight">Đặt hàng</h1>
      <div className="mt-8"><CheckoutForm /></div>
    </Container>
  );
}
