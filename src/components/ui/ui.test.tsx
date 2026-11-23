import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";
import { LinkButton } from "./button";
import { Price } from "./price";

describe("UI primitives", () => {
  it('Price shows "Liên hệ báo giá" for null', () => {
    render(<Price amountVnd={null} />);
    expect(screen.getByText("Liên hệ báo giá")).toBeInTheDocument();
  });

  it("Price formats an amount", () => {
    render(<Price amountVnd={2_490_000} />);
    expect(screen.getByText("2.490.000 ₫")).toBeInTheDocument();
  });

  it("LinkButton renders a link with its href and variant classes", () => {
    render(<LinkButton href="/bao-gia" variant="primary">Nhận báo giá</LinkButton>);
    const link = screen.getByRole("link", { name: "Nhận báo giá" });
    expect(link).toHaveAttribute("href", "/bao-gia");
    expect(link.className).toContain("bg-sky");
  });

  it("Badge sun tone uses ink text", () => {
    render(<Badge tone="sun">Bán chạy</Badge>);
    expect(screen.getByText("Bán chạy").className).toMatch(/bg-sun.*text-ink|text-ink.*bg-sun/);
  });
});
