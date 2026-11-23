import { afterEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));

const { POST } = await import("./route");

function request(secret: string | null, tags: unknown) {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json", ...(secret === null ? {} : { "x-revalidate-secret": secret }) },
    body: JSON.stringify({ tags }),
  });
}

describe("POST /api/revalidate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    revalidateTag.mockReset();
  });

  it("revalidate route rejects a wrong or missing secret with 401", async () => {
    vi.stubEnv("WEB_REVALIDATE_SECRET", "s3cret");
    expect((await POST(request("nope", ["catalog"]))).status).toBe(401);
    expect((await POST(request(null, ["catalog"]))).status).toBe(401);
    vi.stubEnv("WEB_REVALIDATE_SECRET", "");
    expect((await POST(request("", ["catalog"]))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidate route revalidates each tag", async () => {
    vi.stubEnv("WEB_REVALIDATE_SECRET", "s3cret");
    const response = await POST(request("s3cret", ["catalog", "product:dv-mini"]));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revalidated: ["catalog", "product:dv-mini"] });
    // Admin edits (price, stock, a new article) must show on the very next request, not after one stale view.
    expect(revalidateTag).toHaveBeenCalledWith("catalog", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("product:dv-mini", { expire: 0 });
  });

  it("rejects a body without a tag list", async () => {
    vi.stubEnv("WEB_REVALIDATE_SECRET", "s3cret");
    expect((await POST(request("s3cret", "catalog"))).status).toBe(400);
  });
});
