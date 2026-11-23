import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OauthCallback } from "./oauth-callback";

describe("OauthCallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("trades the one-time code for a session and confirms sign-in", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test");
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ accessToken: "t", user: { email: "an@example.com", id: "u", roles: [] } }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(<OauthCallback code="one-time" />);

    expect(await screen.findByRole("heading", { name: "Đăng nhập thành công" })).toBeInTheDocument();
    expect(screen.getByText("an@example.com")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/auth/oauth/exchange",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ code: "one-time" }) }),
    );
  });

  it("offers to retry when the code is missing or rejected", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));

    render(<OauthCallback code="expired" />);

    expect(await screen.findByRole("heading", { name: "Đăng nhập không thành công" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Thử lại" })).toHaveAttribute("href", "/dang-nhap");
  });
});
