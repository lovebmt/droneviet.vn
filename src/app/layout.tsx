import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { LocalizedChrome } from "@/components/localized-chrome";
import { CartProvider } from "@/components/store/cart-provider";
import { sourceContentEn, sourceContentVi } from "@/content/data/site";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Drone Việt | Drone nghiên cứu & giáo dục",
    template: "%s | Drone Việt",
  },
  description:
    "Drone Việt cung cấp giải pháp drone cho nghiên cứu và giáo dục từ cấp 1 đến đại học: thiết bị, giáo trình, nền tảng thử nghiệm và dịch vụ triển khai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = {
    vi: sourceContentVi.site,
    en: sourceContentEn.site,
  };

  return (
    <html
      lang="vi"
      className={`${manrope.variable} ${newsreader.variable} h-full antialiased`}
    >
      <head>
        {/* Zalo Platform domain verification: must be near the top of <head>, not streamed metadata. */}
        <meta
          name="zalo-platform-site-verification"
          content="PzQUCUMW91XYhF8xX8af0KEYinklr6XDDJCo"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <LocalizedChrome content={content}>{children}</LocalizedChrome>
        </CartProvider>
      </body>
    </html>
  );
}
