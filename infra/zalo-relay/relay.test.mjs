// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRelayServer } from "./relay.mjs";

const SECRET = "relay-secret-0123456789";
let server;

async function start(fetchImpl) {
  server = createRelayServer({ secret: SECRET, fetchImpl });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

function zaloReply(body, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

describe("zalo relay", () => {
  afterEach(() => new Promise((resolve) => (server ? server.close(resolve) : resolve())));

  it("refuses to start without a strong secret", () => {
    expect(() => createRelayServer({ secret: "short" })).toThrow(/RELAY_SECRET/);
  });

  it("forwards an authorised profile request to Zalo with the user's token and returns Zalo's JSON as-is", async () => {
    const fetchImpl = zaloReply({ id: "z-1", name: "Bình" });
    const base = await start(fetchImpl);

    const response = await fetch(`${base}/zalo/me?fields=id,name`, {
      headers: { "x-relay-secret": SECRET, "x-zalo-access-token": "user-token" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "z-1", name: "Bình" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://graph.zalo.me/v2.0/me?fields=id,name",
      expect.objectContaining({ headers: { access_token: "user-token" } }),
    );
  });

  it("passes Zalo's error answers through untouched, including their status", async () => {
    const base = await start(zaloReply({ error: -216, message: "Access token is invalid" }, 200));

    const response = await fetch(`${base}/zalo/me?fields=id`, {
      headers: { "x-relay-secret": SECRET, "x-zalo-access-token": "bad" },
    });

    expect(await response.json()).toEqual({ error: -216, message: "Access token is invalid" });
  });

  it("rejects a missing or wrong secret without calling Zalo", async () => {
    const fetchImpl = zaloReply({});
    const base = await start(fetchImpl);

    const missing = await fetch(`${base}/zalo/me?fields=id`, { headers: { "x-zalo-access-token": "t" } });
    const wrong = await fetch(`${base}/zalo/me?fields=id`, {
      headers: { "x-relay-secret": "nope-nope-nope-nope", "x-zalo-access-token": "t" },
    });

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("only relays known profile fields and requires an access token", async () => {
    const fetchImpl = zaloReply({});
    const base = await start(fetchImpl);
    const auth = { "x-relay-secret": SECRET, "x-zalo-access-token": "t" };

    const injected = await fetch(`${base}/zalo/me?fields=id,name&access_token=steal`, { headers: auth });
    const odd = await fetch(`${base}/zalo/me?fields=phone,../../x`, { headers: auth });
    const noToken = await fetch(`${base}/zalo/me?fields=id`, { headers: { "x-relay-secret": SECRET } });

    expect(injected.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][0]).toBe("https://graph.zalo.me/v2.0/me?fields=id,name");
    expect(odd.status).toBe(400);
    expect(noToken.status).toBe(400);
  });

  it("is not an open proxy: every other path or method is a 404, and /health is public", async () => {
    const fetchImpl = zaloReply({});
    const base = await start(fetchImpl);
    const auth = { "x-relay-secret": SECRET, "x-zalo-access-token": "t" };

    expect((await fetch(`${base}/anything-else`, { headers: auth })).status).toBe(404);
    expect((await fetch(`${base}/zalo/me?fields=id`, { method: "POST", headers: auth })).status).toBe(404);
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("answers 502 when Zalo is unreachable", async () => {
    const base = await start(vi.fn(async () => { throw new Error("network down"); }));

    const response = await fetch(`${base}/zalo/me?fields=id`, {
      headers: { "x-relay-secret": SECRET, "x-zalo-access-token": "t" },
    });

    expect(response.status).toBe(502);
  });
});
