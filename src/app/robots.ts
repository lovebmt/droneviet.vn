import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/tai-khoan", "/gio-hang", "/thanh-toan", "/api/"] },
    sitemap: "https://www.droneviet.vn/sitemap.xml",
    host: "https://www.droneviet.vn",
  };
}
