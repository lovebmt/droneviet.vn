import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { metadata } from "./page";

describe("apex droneviet.vn routing", () => {
  it("redirects every apex path except the homepage to www (homepage stays for Zalo verification)", async () => {
    const redirects = await nextConfig.redirects!();

    expect(redirects).toContainEqual({
      source: "/:path+",
      has: [{ type: "host", value: "droneviet.vn" }],
      destination: "https://www.droneviet.vn/:path+",
      permanent: true,
    });
  });

  it("marks the homepage canonical on www so the apex copy is not a duplicate", () => {
    expect(metadata?.alternates?.canonical).toBe("https://www.droneviet.vn/");
  });
});
