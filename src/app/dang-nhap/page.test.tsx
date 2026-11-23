import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CustomerLoginPage from "./page";

describe("CustomerLoginPage sign-in errors", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("passes a known reason code through and ignores anything else in the URL", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ google: false, zalo: false }) })));

    render(await CustomerLoginPage({ searchParams: Promise.resolve({ error: "zalo", reason: "state" }) }));
    expect(await screen.findByText("Mã lỗi: state")).toBeInTheDocument();
  });

  it("drops an unrecognised reason instead of echoing it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ google: false, zalo: false }) })));

    render(await CustomerLoginPage({ searchParams: Promise.resolve({ error: "zalo", reason: "<b>evil</b>" }) }));
    expect(await screen.findByText(/Đăng nhập Zalo không thành công/)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("evil");
    expect(document.body.textContent).not.toContain("Mã lỗi");
  });
});
