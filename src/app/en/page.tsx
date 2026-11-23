import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EnShell } from "@/components/page/en-shell";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { EN_LEVELS, EN_OFFER } from "@/content/en";
import { listProducts } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Drone education for schools",
  description: "Complete drone classroom kits, bilingual curriculum and teacher training for Vietnamese and international schools.",
  alternates: { canonical: "/en", languages: { vi: "/" } },
};

export default async function EnHomePage() {
  const combos = await listProducts("combo");
  return (
    <EnShell viHref="/">
      <section className="bg-gradient-to-b from-sky-50 to-white">
        <Container className="py-16 sm:py-24">
          <h1 className="max-w-3xl text-5xl font-light tracking-tight sm:text-6xl">Drone education for every classroom</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">Drone Việt equips schools in Vietnam with complete classroom kits, a bilingual curriculum and teacher training, from primary school to university.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/en/education" size="lg">Explore the programme</LinkButton>
            <LinkButton href="/bao-gia" size="lg" variant="secondary">Request a quote</LinkButton>
          </div>
        </Container>
      </section>
      <Section>
        <h2 className="text-3xl font-light tracking-tight">What a school gets</h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {EN_OFFER.map((o) => <li key={o.title}><h3 className="text-lg font-semibold">{o.title}</h3><p className="mt-1 text-muted">{o.text}</p></li>)}
        </ul>
      </Section>
      {combos.length ? (
        <Section tone="sky">
          <h2 className="text-3xl font-light tracking-tight">Classroom kits</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {combos.map((c) => (
              <li key={c.slug}>
                <Link href={`/en/combo/${c.slug}`} className="group flex h-full flex-col rounded-2xl bg-white p-6">
                  <span className="text-xl font-semibold group-hover:text-sky">{c.nameEn ?? c.name}</span>
                  <span className="mt-auto inline-flex items-center gap-0.5 pt-4 font-semibold text-sky">View kit <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section>
        <h2 className="text-3xl font-light tracking-tight">By school level</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EN_LEVELS.map((l) => <li key={l.slug} className="rounded-2xl border border-line p-6"><h3 className="text-lg font-semibold">{l.name}</h3><p className="mt-1 text-muted">{l.text}</p></li>)}
        </ul>
      </Section>
    </EnShell>
  );
}
