import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

/** Called by the API after catalog/content/settings writes (spec §9.4). */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.WEB_REVALIDATE_SECRET ?? "";
  const provided = request.headers.get("x-revalidate-secret") ?? "";
  if (!secret || !sameSecret(provided, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string" && tag.length > 0) : null;
  if (!tags) {
    return Response.json({ error: "tags must be an array of strings" }, { status: 400 });
  }

  // Called by the API (an external system) after admin writes: expire now, so the next visitor
  // gets the new price, stock or article instead of one stale view (Next docs: webhooks use expire: 0).
  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }
  return Response.json({ revalidated: tags });
}

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
