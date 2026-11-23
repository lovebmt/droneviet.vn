import type { Metadata } from "next";
import { DroneHeroCarousel } from "@/components/drone-hero-carousel";
import { getSiteContent, type Locale } from "@/lib/content";

// The homepage is also served (not redirected) on apex droneviet.vn for Zalo verification;
// the canonical keeps www as the indexed copy.
export const metadata: Metadata = {
  alternates: { canonical: "https://www.droneviet.vn/" },
};

export function HomePageContent({ locale = "vi" }: { locale?: Locale }) {
  const site = getSiteContent(locale);

  return (
    <DroneHeroCarousel
      eyebrow={site.hero.eyebrow}
      title={site.hero.title}
      description={site.hero.description}
      primaryCta={site.hero.primaryCta}
      secondaryCta={site.hero.secondaryCta}
    />
  );
}

export default function Home() {
  return <HomePageContent locale="vi" />;
}
