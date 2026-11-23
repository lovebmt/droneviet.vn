import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const UPSTREAM = "https://graph.zalo.me/v2.0/me";
const ALLOWED_FIELDS = new Set(["id", "name", "picture"]);

/**
 * Zalo only returns personal info to callers with a Vietnam IP, but our API runs on Vercel (US).
 * This relay runs on a Vietnam host and does exactly one thing: GET the Zalo profile for a token.
 * It stores nothing and holds no Zalo app secret.
 */
export function createRelayServer({ secret, fetchImpl = fetch, upstream = UPSTREAM }) {
  if (typeof secret !== "string" || secret.length < 16) {
    throw new Error("RELAY_SECRET must be at least 16 characters");
  }

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://relay");

    if (req.method === "GET" && url.pathname === "/health") {
      return send(res, 200, { status: "ok" });
    }
    if (req.method !== "GET" || url.pathname !== "/zalo/me") {
      return send(res, 404, { error: "not found" });
    }
    if (!sameSecret(req.headers["x-relay-secret"], secret)) {
      return send(res, 401, { error: "unauthorized" });
    }

    const accessToken = req.headers["x-zalo-access-token"];
    const fields = (url.searchParams.get("fields") ?? "id").split(",");
    if (typeof accessToken !== "string" || !accessToken || !fields.every((f) => ALLOWED_FIELDS.has(f))) {
      return send(res, 400, { error: "bad request" });
    }

    try {
      const answer = await fetchImpl(`${upstream}?fields=${fields.join(",")}`, {
        headers: { access_token: accessToken },
        signal: AbortSignal.timeout(8000),
      });
      res.writeHead(answer.status, { "content-type": "application/json" });
      res.end(await answer.text());
    } catch {
      send(res, 502, { error: "upstream unreachable" });
    }
  });
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function sameSecret(provided, expected) {
  if (typeof provided !== "string") {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
