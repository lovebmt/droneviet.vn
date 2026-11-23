import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

/** A titled band on detail pages, separated by a hairline. */
export function DetailSection({ id, title, children, wide = false }: { id: string; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line">
      <Container className="py-12">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight">{title}</h2>
        <div className={`mt-6 ${wide ? "" : "max-w-4xl"}`}>{children}</div>
      </Container>
    </section>
  );
}
