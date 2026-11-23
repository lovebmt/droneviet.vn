import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerGate } from "./customer-gate";

function mockProviders(providers: { google: boolean; zalo: boolean }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => providers })),
  );
}

describe("CustomerGate social sign-in", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("links only the providers the API reports as configured", async () => {
    mockProviders({ google: true, zalo: false });
    render(<CustomerGate mode="login" />);

    const google = await screen.findByRole("link", { name: "Tiếp tục với Google" });
    expect(google).toHaveAttribute("href", "https://api.test/auth/google");
    expect(screen.queryByRole("link", { name: "Tiếp tục với Zalo" })).not.toBeInTheDocument();
    expect(screen.queryByText(/chưa được cấu hình/)).not.toBeInTheDocument();
  });

  it("shows no social section when no provider is configured", async () => {
    mockProviders({ google: false, zalo: false });
    render(<CustomerGate mode="login" />);

    await screen.findByRole("button", { name: "Đăng nhập" });
    expect(screen.queryByText("hoặc dùng email")).not.toBeInTheDocument();
  });

  it("explains a failed provider sign-in passed back by the API", async () => {
    mockProviders({ google: true, zalo: true });
    render(<CustomerGate mode="login" oauthError="zalo" />);

    expect(await screen.findByText("Đăng nhập Zalo không thành công. Vui lòng thử lại.")).toBeInTheDocument();
  });
});
