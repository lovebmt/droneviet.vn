import type { NextConfig } from "next";

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
    ];
  },
};

export default nextConfig;
