/** API origin without a trailing slash; local default for development. */
export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_COMMERCE_API_URL || "http://localhost:4000").replace(/\/$/, "");
}
