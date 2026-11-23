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

  it("old URLs redirect permanently to v2 URLs keeping the slug", async () => {
    const redirects = await nextConfig.redirects!();
    const expected: Array<[string, string]> = [
      ["/san-pham/:slug", "/cua-hang/:slug"],
      ["/san-pham", "/cua-hang"],
      ["/cua-hang/danh-muc/:topic", "/cua-hang"],
      ["/giai-phap", "/giao-duc"],
      ["/dich-vu", "/giao-duc"],
      ["/giao-trinh", "/giao-duc"],
      ["/khoa-hoc", "/dao-tao"],
      ["/khoa-hoc/:slug", "/dao-tao/:slug"],
      ["/tin-tuc", "/r-d"],
      ["/tin-tuc/:slug", "/r-d/:slug"],
      ["/theo-doi-don", "/tai-khoan/don-hang"],
    ];
    for (const [source, destination] of expected) {
      expect(redirects).toContainEqual({ source, destination, permanent: true });
    }
  });

  it("marks the homepage canonical on www so the apex copy is not a duplicate", () => {
    expect(metadata?.alternates?.canonical).toBe("https://www.droneviet.vn/");
  });
});
