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
      ["/giai-phap", "/giao-duc/tieu-hoc"],
      ["/dich-vu", "/giao-duc/tieu-hoc"],
      ["/giao-trinh", "/giao-duc/tieu-hoc"],
      ["/khoa-hoc", "/dao-tao/chung-chi"],
      ["/khoa-hoc/:slug", "/dao-tao/chung-chi"],
      // Removed v2 pages: the education overview and the course list
      ["/giao-duc", "/giao-duc/tieu-hoc"],
      ["/dao-tao", "/dao-tao/chung-chi"],
      ["/tin-tuc", "/r-d"],
      ["/tin-tuc/:slug", "/r-d/:slug"],
      ["/theo-doi-don", "/tai-khoan/don-hang"],
    ];
    for (const [source, destination] of expected) {
      expect(redirects).toContainEqual({ source, destination, permanent: true });
    }
  });

  it("the education overview and the course pages are gone", async () => {
    const { existsSync } = await import("node:fs");
    for (const file of ["src/app/giao-duc/page.tsx", "src/app/dao-tao/page.tsx", "src/app/dao-tao/[slug]/page.tsx"]) {
      expect(existsSync(file), file).toBe(false);
    }
  });

  it("marks the homepage canonical on www so the apex copy is not a duplicate", () => {
    expect(metadata?.alternates?.canonical).toBe("https://www.droneviet.vn/");
  });
});
