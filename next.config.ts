import type { NextConfig } from "next";

const LEGACY_REDIRECTS: Array<[string, string]> = [
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

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      // Apex droneviet.vn: everything but the homepage goes to www. The homepage stays so
      // Zalo's domain verifier (which does not follow redirects) can read its meta tag.
      {
        source: "/:path+",
        has: [{ type: "host", value: "droneviet.vn" }],
        destination: "https://www.droneviet.vn/:path+",
        permanent: true,
      },
      // v1 URLs → v2 (spec §6), so links Google already indexed keep working.
      ...LEGACY_REDIRECTS.map(([source, destination]) => ({ source, destination, permanent: true })),
    ];
  },
};

export default nextConfig;
