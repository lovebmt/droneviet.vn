/** Full-page navigation to an external URL (PayOS checkout); a module so tests can replace it. */
export function goTo(url: string): void {
  window.location.assign(url);
}
