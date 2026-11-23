import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("Markdown embeds a valid YouTube id with youtube-nocookie", () => {
    const { container } = render(<Markdown source={"Xem video:\n\n::youtube{id=dQw4w9WgXcQ}"} />);
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(iframe?.getAttribute("title")).toBeTruthy();
  });

  it("Markdown drops an invalid YouTube id and raw HTML", () => {
    const { container } = render(
      <Markdown source={'::youtube{id="x\\" onload=alert(1)"}\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>'} />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img[onerror]")).toBeNull();
  });

  it("Markdown renders note and product directives", () => {
    render(
      <Markdown
        source={":::note\nNhớ đeo kính bảo hộ.\n:::\n\n::product{slug=dv-code-fleet}"}
        relatedProducts={[{ slug: "dv-code-fleet", name: "DV Code Fleet", nameEn: null, summary: "Fleet", kind: "drone", levels: [], coverImageUrl: null, badge: null, fromPriceVnd: 24_900_000, purchaseMode: "checkout", inStock: true, featured: false }]}
      />,
    );
    expect(screen.getByRole("note")).toHaveTextContent("Nhớ đeo kính bảo hộ.");
    expect(screen.getByRole("link", { name: /DV Code Fleet/ })).toHaveAttribute("href", "/cua-hang/dv-code-fleet");
  });

  it("Markdown renders GFM tables", () => {
    render(<Markdown source={"| A | B |\n|---|---|\n| 1 | 2 |"} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
