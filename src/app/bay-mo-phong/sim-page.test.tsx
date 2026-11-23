import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";

const loader = vi.hoisted(() => ({ loadSimulator: vi.fn() }));
vi.mock("@/components/sim/load-simulator", () => loader);

const { default: SimPage } = await import("./page");
const { saveResult, loadBest } = await import("@/components/sim/results");

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  loader.loadSimulator.mockReset().mockResolvedValue({ SimulatorApp: ({ missionId }: { missionId: string }) => <p>Đang bay {missionId}</p> });
  fetchMock = vi.fn(async () => json({}, 401));
  vi.stubGlobal("fetch", fetchMock);
});

describe("simulator page", () => {
  it("page lists the four missions and does not load the engine until start", async () => {
    render(<AppProviders><SimPage /></AppProviders>);
    for (const title of ["Cất cánh và giữ độ cao", "Hạ cánh vào ô", "Bay qua chuỗi vòng", "Bay số 8"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(loader.loadSimulator).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getAllByRole("button", { name: /Bắt đầu/ })[2]));
    expect(loader.loadSimulator).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Đang bay vong")).toBeInTheDocument();
  });

  it("results are kept locally and posted only when signed in", async () => {
    await saveResult({ mission: "vong", score: 800, stars: 2, timeMs: 50_000, crashes: 1 }, false);
    expect(fetchMock).not.toHaveBeenCalled();
    await saveResult({ mission: "vong", score: 600, stars: 1, timeMs: 70_000, crashes: 2 }, false);
    expect(loadBest().vong).toMatchObject({ score: 800, stars: 2 });

    fetchMock.mockResolvedValue(json({ id: "r" }, 201));
    await saveResult({ mission: "vong", score: 900, stars: 3, timeMs: 40_000, crashes: 0 }, true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/me\/sim-results$/);
    expect(JSON.parse(String(init.body))).toEqual({ mission: "vong", score: 900, stars: 3, timeMs: 40_000, crashes: 0 });
    expect(loadBest().vong.score).toBe(900);
  });

  it("an API failure while saving does not throw", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(saveResult({ mission: "so-8", score: 1, stars: 1, timeMs: 1, crashes: 0 }, true)).resolves.toBeUndefined();
    await waitFor(() => expect(loadBest()["so-8"]).toBeDefined());
  });
});
