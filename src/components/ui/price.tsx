import { formatVnd } from "@/lib/format";

/** Null means the product is sold by quote (spec §16): never invent a price. */
export function Price({ amountVnd, className = "" }: { amountVnd: number | null; className?: string }) {
  return <span className={className}>{amountVnd === null ? "Liên hệ báo giá" : formatVnd(amountVnd)}</span>;
}
