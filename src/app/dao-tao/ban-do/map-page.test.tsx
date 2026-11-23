import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { DEFAULT_SETTINGS } from "@/lib/api/types";

const api = vi.hoisted(() => ({ getArticle: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
const { default: MapPage } = await import("./page");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  api.getArticle.mockResolvedValue(null);
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
});

describe("flight zone map page", () => {
  it("links to the official map without embedding it", async () => {
    const { container } = render(<AppProviders>{await MapPage()}</AppProviders>);
    expect(api.getArticle).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: "Bản đồ khu vực bay" })).toBeInTheDocument();
    expect(screen.queryByText("Bản đồ chỉ để tham khảo")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tóm tắt nhanh" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /cambay\.mod\.gov\.vn/i })).toHaveAttribute("href", "https://cambay.mod.gov.vn");
    expect(container.querySelector("iframe")).toBeNull();
  });
});
