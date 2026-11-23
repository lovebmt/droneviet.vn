import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({ Be_Vietnam_Pro: () => ({ variable: "font" }) }));
const { metadata } = await import("./layout");
const og = await import("./opengraph-image");

describe("site-wide sharing metadata", () => {
  it("every page shares as Drone Việt in Vietnamese with a large image card", () => {
    expect(metadata.openGraph).toMatchObject({ siteName: "Drone Việt", locale: "vi_VN", type: "website" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("the default share image is 1200 × 630 PNG", () => {
    expect(og.size).toEqual({ width: 1200, height: 630 });
    expect(og.contentType).toBe("image/png");
    expect(og.alt).toContain("Drone Việt");
  });
});
