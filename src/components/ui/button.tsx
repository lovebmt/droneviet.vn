import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "sun";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-sky text-white hover:bg-[#095fc0]",
  secondary: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-white",
  ghost: "text-ink underline-offset-4 hover:underline",
  sun: "bg-sun text-ink hover:bg-[#f5b800]",
};

const SIZES: Record<Size, string> = {
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md"): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
  ].join(" ");
}

export function Button({
  variant,
  size,
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${buttonClasses(variant, size)} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  variant,
  size,
  className = "",
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "className"> & { variant?: Variant; size?: Size; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${buttonClasses(variant, size)} ${className}`} {...props}>
      {children}
    </Link>
  );
}
