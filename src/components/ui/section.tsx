import type { ReactNode } from "react";
import { Container } from "./container";

/** Vertical rhythm for page sections; "sky" is the pale product-tile background. */
export function Section({
  children,
  tone = "paper",
  className = "",
  id,
}: {
  children: ReactNode;
  tone?: "paper" | "sky";
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${tone === "sky" ? "bg-sky-50" : "bg-white"} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}
