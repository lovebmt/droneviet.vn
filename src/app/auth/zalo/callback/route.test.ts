import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /auth/zalo/callback (web relay)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("forwards Zalo's callback with its query string to the API", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test/");

    const response = await GET(new Request("https://www.droneviet.vn/auth/zalo/callback?code=abc&state=s1"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://api.test/auth/zalo/callback?code=abc&state=s1");
  });
});
