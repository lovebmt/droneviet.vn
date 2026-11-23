import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiGetOrNull, listArticles, listProducts } from "./server";

describe("server API client", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test/"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("apiGet returns fallback when the API is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    await expect(apiGet("/catalog/products?kind=drone", { tags: ["catalog"], fallback: [] })).resolves.toEqual([]);

    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    await expect(apiGet("/settings/public", { tags: ["settings"], fallback: { ok: false } })).resolves.toEqual({ ok: false });
  });

  it("apiGet passes tags and revalidate to fetch", async () => {
    const fetchMock = vi.fn(async () => Response.json([{ slug: "dv-mini" }]));
    vi.stubGlobal("fetch", fetchMock);

    await listProducts("drone");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/catalog/products?kind=drone",
      expect.objectContaining({ next: { tags: ["catalog"], revalidate: 300 } }),
    );
  });

  it("listArticles asks for legal guides by kind", async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    await listArticles({ kind: "phap-ly" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/content/articles?kind=phap-ly", expect.anything());
  });

  it("apiGetOrNull returns null on 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    await expect(apiGetOrNull("/catalog/products/khong-co", { tags: ["product:khong-co"] })).resolves.toBeNull();
  });
});
