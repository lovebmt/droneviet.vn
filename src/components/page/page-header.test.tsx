import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

const chips = <nav aria-label="Chủ đề"><a href="/a">A</a><a href="/b">B</a></nav>;

describe("PageHeader", () => {
  it("compact keeps title and lead on one line and the chips in one scrolling row", () => {
    const { container } = render(<PageHeader compact title="R&D" lead="Hướng dẫn lắp ráp, lập trình" crumbs={[{ label: "Trang chủ", href: "/" }, { label: "R&D" }]}>{chips}</PageHeader>);
    const header = container.querySelector("header")!;
    const h1 = screen.getByRole("heading", { level: 1, name: "R&D" });
    const lead = screen.getByText("Hướng dẫn lắp ráp, lập trình");
    expect(h1.className).not.toMatch(/text-4xl|text-5xl/);
    expect(lead.className).toContain("truncate");
    expect(h1.parentElement).toBe(lead.parentElement); // same row
    const row = screen.getByRole("navigation", { name: "Chủ đề" }).parentElement!;
    expect(row.className).toMatch(/overflow-x-auto/);
    expect(row.className).toMatch(/\[&>nav\]:flex-nowrap/);
    expect(header.firstElementChild!.className).not.toMatch(/py-10|py-14/);
  });

  it("the default header is unchanged", () => {
    render(<PageHeader title="Workshop" lead="Một buổi trải nghiệm" />);
    expect(screen.getByRole("heading", { level: 1 }).className).toMatch(/text-4xl/);
  });
});
