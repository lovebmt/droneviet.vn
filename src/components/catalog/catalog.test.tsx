import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import type { ProductCard } from "@/lib/api/types";
import { HeroCarousel } from "@/components/page/hero-carousel";
import { PurchaseButton } from "./purchase-button";

const base: ProductCard = {
  slug: "dv-mini", name: "DV Mini", nameEn: null, summary: "s", kind: "drone", levels: [], coverImageUrl: null,
  badge: null, fromPriceVnd: 2_490_000, purchaseMode: "checkout", inStock: true, featured: false,
};

describe("PurchaseButton", () => {
  it("PurchaseButton shows Hết hàng disabled for an out-of-stock checkout product", () => {
    render(<AppProviders><PurchaseButton product={{ ...base, inStock: false }} variantId="v1" /></AppProviders>);
    expect(screen.getByRole("button", { name: "Hết hàng" })).toBeDisabled();
  });

  it("PurchaseButton adds an in-stock product to the cart", () => {
    render(<AppProviders><PurchaseButton product={base} variantId="v1" /></AppProviders>);
    expect(screen.getByRole("button", { name: "Thêm vào giỏ" })).toBeEnabled();
  });

  it("PurchaseButton sends combos to the quote form", () => {
    render(<AppProviders><PurchaseButton product={{ ...base, slug: "combo-x", kind: "combo", purchaseMode: "quote_only", fromPriceVnd: null }} /></AppProviders>);
    expect(screen.getByRole("link", { name: "Nhận báo giá" })).toHaveAttribute("href", "/bao-gia?san-pham=combo-x");
  });

  it("PurchaseButton offers preorder through the quote form", () => {
    render(<AppProviders><PurchaseButton product={{ ...base, purchaseMode: "preorder" }} variantId="v1" /></AppProviders>);
    expect(screen.getByRole("link", { name: "Đặt trước" })).toHaveAttribute("href", "/bao-gia?san-pham=dv-mini");
  });
});

describe("HeroCarousel", () => {
  it("HeroCarousel moves to the next slide with the next button", () => {
    render(
      <HeroCarousel
        slides={[
          { context: "Giải pháp", title: "Combo Lớp học Quốc tế", subtitle: "a", actions: [] },
          { context: "Trải nghiệm", title: "Bay mô phỏng", subtitle: "b", actions: [] },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Combo Lớp học Quốc tế" })).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Slide tiếp theo" }).click());
    expect(screen.getByRole("heading", { level: 1, name: "Bay mô phỏng" })).toBeInTheDocument();
  });
});
