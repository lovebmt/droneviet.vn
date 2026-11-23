import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapPanel } from "./map-panel";
import type { ZoneCollection } from "./zones";

const zones: ZoneCollection = {
  type: "FeatureCollection",
  metadata: { builtAt: "2026-11-23", sources: [] },
  features: [
    {
      type: "Feature",
      properties: { kind: "cam", category: "san-bay", name: "Sân bay Quốc tế Nội Bài", rule: "QĐ 18/2020/QĐ-TTg, Điều 3 khoản 4" },
      geometry: { type: "Polygon", coordinates: [[[105.6, 21.1], [106, 21.1], [106, 21.3], [105.6, 21.3], [105.6, 21.1]]] },
    },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

describe("map panel", () => {
  it("search failure shows a message", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<MapPanel zones={zones} picked={null} onPick={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Tìm địa điểm"), { target: { value: "Sóc Sơn" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Tìm" })));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tìm được địa điểm");
  });

  it("search results can be picked and are limited to Vietnam", async () => {
    fetchMock.mockResolvedValue(Response.json([{ lat: "21.25", lon: "105.85", display_name: "Sóc Sơn, Hà Nội, Việt Nam" }]));
    const onPick = vi.fn();
    render(<MapPanel zones={zones} picked={null} onPick={onPick} />);
    fireEvent.change(screen.getByLabelText("Tìm địa điểm"), { target: { value: "Sóc Sơn" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Tìm" })));
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/nominatim\.openstreetmap\.org\/search\?.*countrycodes=vn/);
    fireEvent.click(await screen.findByRole("button", { name: /Sóc Sơn, Hà Nội/ }));
    expect(onPick).toHaveBeenCalledWith({ lat: 21.25, lon: 105.85, label: "Sóc Sơn, Hà Nội, Việt Nam" });
  });

  it("clicking a point reports its zone", () => {
    render(<MapPanel zones={zones} picked={{ lat: 21.2, lon: 105.8 }} onPick={vi.fn()} />);
    const result = screen.getByRole("status");
    expect(result).toHaveTextContent("Trong khu vực cấm bay");
    expect(result).toHaveTextContent("Sân bay Quốc tế Nội Bài");
    expect(result).toHaveTextContent("QĐ 18/2020/QĐ-TTg, Điều 3 khoản 4");
  });

  it("a point outside the drawn zones is never reported as allowed", () => {
    render(<MapPanel zones={zones} picked={{ lat: 12.2, lon: 109.2 }} onPick={vi.fn()} />);
    const result = screen.getByRole("status");
    expect(result).toHaveTextContent("Không nằm trong vùng đã vẽ");
    expect(result).not.toHaveTextContent(/được phép bay|bay được/i);
    expect(screen.getByRole("link", { name: /bản đồ chính thức/i })).toHaveAttribute("href", "https://cambay.mod.gov.vn");
  });
});
