import type { Metadata } from "next";
import { Check } from "lucide-react";
import { EnShell } from "@/components/page/en-shell";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { EN_LEVELS, EN_OFFER, EN_STEPS } from "@/content/en";
import { INTERNATIONAL } from "@/content/education";

export const metadata: Metadata = {
  title: "Drone programme for schools",
  description: "Equipment, bilingual curriculum, teacher training and year-round support for drone classes.",
  alternates: { canonical: "/en/education", languages: { vi: "/giao-duc" } },
};

export default function EnEducationPage() {
  return (
    <EnShell viHref="/giao-duc">
      <section className="border-b border-line bg-gradient-to-b from-sky-50 to-white">
        <Container className="py-12 sm:py-16">
          <h1 className="max-w-3xl text-4xl font-light tracking-tight sm:text-5xl">A drone programme your teachers can run</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">Everything a school needs to start teaching drones this year, with lessons in English and Vietnamese.</p>
          <LinkButton href={`/bao-gia?san-pham=${INTERNATIONAL.comboSlug}`} size="lg" className="mt-8">Request a quote</LinkButton>
        </Container>
      </section>
      <Section>
        <h2 className="text-3xl font-light tracking-tight">What is included</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {EN_OFFER.map((o) => (
            <li key={o.title} className="flex gap-3 rounded-2xl bg-sky-50 p-5">
              <Check size={20} strokeWidth={2} className="mt-1 shrink-0 text-teal-ink" aria-hidden="true" />
              <span><span className="block font-semibold">{o.title}</span><span className="text-muted">{o.text}</span></span>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="sky">
        <h2 className="text-3xl font-light tracking-tight">School levels</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EN_LEVELS.map((l) => <li key={l.slug} className="rounded-2xl bg-white p-6"><h3 className="text-lg font-semibold">{l.name}</h3><p className="mt-1 text-muted">{l.text}</p></li>)}
        </ul>
      </Section>
      <Section>
        <h2 className="text-3xl font-light tracking-tight">Getting started in four steps</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {EN_STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-4">
              <span className="text-sm font-semibold text-muted">Step {i + 1}</span>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <LinkButton href={`/en/combo/${INTERNATIONAL.comboSlug}`} className="mt-10" variant="secondary">See the international class kit</LinkButton>
      </Section>
    </EnShell>
  );
}
