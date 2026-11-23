import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSettings } from "@/lib/api/server";
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  return (
    <html lang="vi" className={beVietnam.variable}>
      <head>
        {/* Zalo Platform domain verification: must be near the top of <head>, not streamed metadata. */}
        <meta name="zalo-platform-site-verification" content="PzQUCUMW91XYhF8xX8af0KEYinklr6XDDJCo" />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
          Bỏ qua tới nội dung
        </a>
        <AppProviders>
          <AnnouncementBar announcement={settings.announcement} />
          <SiteHeader />
          <main id="noi-dung" className="flex-1">{children}</main>
          <SiteFooter settings={settings} />
        </AppProviders>
      </body>
    </html>
  );
}
