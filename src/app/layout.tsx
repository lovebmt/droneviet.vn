import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.droneviet.vn"),
  title: {
    default: "Drone Việt | Giải pháp drone cho giáo dục",
    template: "%s | Drone Việt",
  },
  description: "Drone Việt cung cấp giải pháp drone trọn bộ cho giáo dục: combo lớp học, drone, linh kiện, đào tạo và chứng chỉ.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <head>
        {/* Zalo Platform domain verification: must be near the top of <head>, not streamed metadata. */}
        <meta name="zalo-platform-site-verification" content="PzQUCUMW91XYhF8xX8af0KEYinklr6XDDJCo" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
