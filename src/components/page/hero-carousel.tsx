"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { ProductImage } from "@/components/catalog/product-image";

export interface HeroSlide {
  context: string;
  title: string;
  subtitle: string;
  image?: string | null;
  actions: Array<{ label: string; href: string; variant?: "primary" | "secondary" | "sun" }>;
}

/** Full-bleed hero (spec §7.5): auto-advances every 7 s unless hovered, focused or reduced motion. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;
  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Giới thiệu"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative overflow-hidden bg-gradient-to-br from-sky-50 to-[#e3faf6]"
    >
      <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr]">
        <div aria-live="polite">
          <p className="text-[15px] font-semibold text-teal-ink">{slide.context}</p>
          <h1 className="mt-3 text-balance text-4xl font-light leading-[1.08] tracking-tight sm:text-6xl">{slide.title}</h1>
          <p className="mt-5 max-w-xl text-lg font-semibold">{slide.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {slide.actions.map((action) => (
              <LinkButton key={action.href + action.label} href={action.href} size="lg" variant={action.variant ?? "primary"}>
                {action.label}
              </LinkButton>
            ))}
          </div>
        </div>
        <ProductImage src={slide.image ?? null} alt={slide.title} sizes="(min-width: 1024px) 45vw, 90vw" priority className="aspect-[4/3] w-full rounded-2xl" />
      </div>
      {count > 1 ? (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
          <button type="button" aria-label="Slide trước" onClick={() => setIndex((i) => (i - 1 + count) % count)} className="rounded-full bg-white p-2 ring-1 ring-line hover:bg-sky-50">
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          {slides.map((s, i) => (
            <button key={s.title} type="button" aria-label={`Slide ${i + 1}: ${s.title}`} aria-current={i === index} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-ink" : "w-2 bg-ink/25"}`} />
          ))}
          <button type="button" aria-label="Slide tiếp theo" onClick={() => setIndex((i) => (i + 1) % count)} className="rounded-full bg-white p-2 ring-1 ring-line hover:bg-sky-50">
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
