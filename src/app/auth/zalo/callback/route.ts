/**
 * Zalo only allows OAuth callbacks on a verified domain, and only www.droneviet.vn is verified.
 * Relay the browser (query string intact) to the API, which finishes the sign-in.
 */
export function GET(request: Request): Response {
  const api = (process.env.NEXT_PUBLIC_COMMERCE_API_URL ?? "").replace(/\/$/, "");
  const { search } = new URL(request.url);

  return Response.redirect(`${api}/auth/zalo/callback${search}`, 307);
}
