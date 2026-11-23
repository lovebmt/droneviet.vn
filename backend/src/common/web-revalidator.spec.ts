import { afterEach, describe, expect, it, vi } from "vitest";
import { WebRevalidator } from "./web-revalidator";

function revalidator(env: Record<string, string | undefined>) {
  return new WebRevalidator({ get: (key: string) => env[key] } as never);
}

describe("WebRevalidator", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts tags with the secret", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await revalidator({ WEB_REVALIDATE_URL: "https://www.droneviet.vn/api/revalidate", WEB_REVALIDATE_SECRET: "s3" })
      .revalidate(["catalog", "product:dv-mini"]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.droneviet.vn/api/revalidate",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json", "x-revalidate-secret": "s3" },
        body: JSON.stringify({ tags: ["catalog", "product:dv-mini"] }),
      }),
    );
  });

  it("swallows network errors and timeouts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    await expect(revalidator({ WEB_REVALIDATE_URL: "https://x/api/revalidate", WEB_REVALIDATE_SECRET: "s" }).revalidate(["a"]))
      .resolves.toBeUndefined();

    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted"))))));
    vi.useFakeTimers();
    const pending = revalidator({ WEB_REVALIDATE_URL: "https://x/api/revalidate", WEB_REVALIDATE_SECRET: "s" }).revalidate(["a"]);
    await vi.advanceTimersByTimeAsync(3_100);
    await expect(pending).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it("does nothing when no revalidate URL is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await revalidator({}).revalidate(["a"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
