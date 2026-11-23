import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

describe("Markdown link safety", () => {
  it("drops javascript: and data: link targets", () => {
    render(<Markdown source={"[bấm](javascript:alert(1)) [ảnh](data:text/html,<b>x</b>) [ok](https://droneviet.vn)"} />);
    expect(screen.getByText("bấm").closest("a")?.getAttribute("href") ?? "").not.toMatch(/^javascript:/i);
    expect(screen.getByText("ảnh").closest("a")?.getAttribute("href") ?? "").not.toMatch(/^data:/i);
    expect(screen.getByText("ok").closest("a")).toHaveAttribute("href", "https://droneviet.vn");
  });
});
