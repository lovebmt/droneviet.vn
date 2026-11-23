import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { DEFAULT_SETTINGS } from "@/lib/api/types";

const api = vi.hoisted(() => ({ getArticle: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
const loader = vi.hoisted(() => ({ loadFlightMap: vi.fn() }));
vi.mock("@/components/flight-map/load-flight-map", () => loader);

const { default: MapPage } = await import("./page");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  api.getArticle.mockResolvedValue(null);
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
  loader.loadFlightMap.mockReset().mockReturnValue(new Promise(() => {}));
});

describe("flight zone map page", () => {
  it("shows the legend, the reference note and the official map link", async () => {
    render(<AppProviders>{await MapPage()}</AppProviders>);
    expect(api.getArticle).toHaveBeenCalledWith("khu-vuc-cam-bay-drone");
    expect(screen.getByRole("heading", { level: 1, name: "Bản đồ khu vực bay" })).toBeInTheDocument();
    expect(screen.getByText("Khu vực cấm bay")).toBeInTheDocument();
    expect(screen.getByText("Khu vực hạn chế bay")).toBeInTheDocument();
    expect(screen.getAllByText(/chỉ để tham khảo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /bản đồ chính thức/i })[0]).toHaveAttribute("href", "https://cambay.mod.gov.vn");
    expect(screen.getByText(/Đang tải bản đồ/)).toBeInTheDocument();
  });
});
