/** "9.500.000 ₫" — Vietnamese grouping, no decimals. */
export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN").replace(/,/g, ".")} ₫`;
}

/** "23/11/2026" in Vietnam time. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}
