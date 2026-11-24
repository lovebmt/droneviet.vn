import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/**
 * Page title block. `compact` (listing pages such as R&D and the store) keeps it short so the content
 * starts high: title and lead on one line, and the filter chips (children) in a single row that
 * scrolls sideways instead of wrapping.
 */
export function PageHeader({ title, lead, crumbs, compact = false, children }: { title: string; lead?: string; crumbs?: Crumb[]; compact?: boolean; children?: ReactNode }) {
  if (compact) {
    return (
      <header className="border-b border-line bg-gradient-to-b from-sky-50 to-white">
        <Container className="py-4 sm:py-5">
          {crumbs ? <Breadcrumbs items={crumbs} /> : null}
          <div className="mt-1.5 flex min-w-0 items-baseline gap-4">
            <h1 className="shrink-0 text-2xl font-normal tracking-tight sm:text-3xl">{title}</h1>
            {lead ? <p className="hidden min-w-0 truncate text-muted sm:block">{lead}</p> : null}
          </div>
          {children ? (
            <div className="-mx-4 mt-3 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [&>nav]:mt-0 [&>nav]:w-max [&>nav]:flex-nowrap [&_a]:shrink-0 [&_a]:whitespace-nowrap">
              {children}
            </div>
          ) : null}
        </Container>
      </header>
    );
  }
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
