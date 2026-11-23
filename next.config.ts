import type { NextConfig } from "next";

const LEGACY_REDIRECTS: Array<[string, string]> = [
  ["/san-pham/:slug", "/cua-hang/:slug"],
  ["/san-pham", "/cua-hang"],
  ["/cua-hang/danh-muc/:topic", "/cua-hang"],
  ["/giai-phap", "/giao-duc/tieu-hoc"],
  ["/dich-vu", "/giao-duc/tieu-hoc"],
  ["/giao-trinh", "/giao-duc/tieu-hoc"],
  ["/khoa-hoc", "/dao-tao/chung-chi"],
  ["/khoa-hoc/:slug", "/dao-tao/chung-chi"],
  // v2 pages removed by the owner: the education overview and the course list.
  ["/giao-duc", "/giao-duc/tieu-hoc"],
  ["/dao-tao", "/dao-tao/chung-chi"],
  ["/tin-tuc", "/r-d"],
  ["/tin-tuc/:slug", "/r-d/:slug"],
  ["/theo-doi-don", "/tai-khoan/don-hang"],
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Media uploaded through the API (R2), production and local development.
    remotePatterns: [
      { protocol: "https", hostname: "api.droneviet.vn", pathname: "/media/**" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/media/**" },
    ],
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
