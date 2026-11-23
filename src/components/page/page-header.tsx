import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export function PageHeader({ title, lead, crumbs, children }: { title: string; lead?: string; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-gradient-to-b from-sky-50 to-white">
      <Container className="py-10 sm:py-14">
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        <h1 className="mt-3 max-w-3xl text-4xl font-light tracking-tight sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-2xl text-lg text-muted">{lead}</p> : null}
        {children}
      </Container>
    </header>
  );
}
