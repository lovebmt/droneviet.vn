import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import type { CourseCard, CourseDetail } from "@/lib/api/types";
import { DEFAULT_SETTINGS } from "@/lib/api/types";

const api = vi.hoisted(() => ({ listCourses: vi.fn(), getCourse: vi.fn(), getSettings: vi.fn() }));
vi.mock("@/lib/api/server", () => api);

const { default: WorkshopPage } = await import("./page");

const ZALO = "https://zalo.me/g/workshop-drone";
const card: CourseCard = {
  slug: "workshop-trai-nghiem-drone", title: "Workshop trải nghiệm drone", summary: "Bay thử drone", level: "workshop", format: "truc-tiep",
  durationHours: 2, tuitionVnd: null, certificateTrack: null, zaloGroupUrl: ZALO,
};
const workshop: CourseDetail = {
  ...card,
  descriptionMarkdown: "Chương trình chi tiết",
  sessions: [{ id: "11111111-1111-4111-8111-111111111111", startsAt: "2026-12-12T01:00:00.000Z", capacity: 30, seatsLeft: 18 }],
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async () => new Response("{}", { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  api.listCourses.mockReset().mockResolvedValue([card]);
  api.getCourse.mockReset().mockResolvedValue(workshop);
  api.getSettings.mockResolvedValue(DEFAULT_SETTINGS);
});

const page = async () => render(<AppProviders>{await WorkshopPage()}</AppProviders>);

describe("workshop page", () => {
  it("shows upcoming workshop sessions and the Zalo group link", async () => {
    await page();
    expect(api.listCourses).toHaveBeenCalledWith({ level: "workshop" });
    expect(screen.getByRole("heading", { level: 1, name: /Workshop trải nghiệm drone/ })).toBeInTheDocument();
    expect(within(screen.getByRole("radiogroup", { name: "Chọn buổi workshop" })).getByText("Còn 18 chỗ")).toBeInTheDocument();
    const groupLinks = screen.getAllByRole("link", { name: /Tham gia nhóm Zalo/ });
    expect(groupLinks.length).toBeGreaterThan(0);
    for (const link of groupLinks) expect(link).toHaveAttribute("href", ZALO);
  });

  it("shows the default intro without a workshop course", async () => {
    api.listCourses.mockResolvedValue([]);
    await page();
    expect(api.getCourse).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Một buổi workshop gồm những gì" })).toBeInTheDocument();
    expect(screen.getByText(/Lịch workshop đang cập nhật/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nhắn Zalo Drone Việt/ })).toHaveAttribute("href", `https://zalo.me/${DEFAULT_SETTINGS.contact.zalo}`);
  });

  it("group form sends organization and size, then shows the Zalo group button", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/enroll") ? Response.json({ id: "e1", status: "reserved", zaloGroupUrl: ZALO }, { status: 201 }) : new Response("{}", { status: 401 }),
    );
    await page();
    fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: "Cô Lan" } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: "0912345678" } });
    fireEvent.change(screen.getByLabelText(/Trường hoặc đơn vị/), { target: { value: "THCS Nguyễn Du" } });
    fireEvent.change(screen.getByLabelText(/Số người tham gia/), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText(/Ghi chú/), { target: { value: "Lớp 7A" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Đăng ký" })));

    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/courses/workshop-trai-nghiem-drone/enroll"))!;
    expect(JSON.parse(String((call[1] as RequestInit).body))).toMatchObject({ organization: "THCS Nguyễn Du", quantity: 12, note: "Lớp 7A", name: "Cô Lan" });
    const done = await screen.findByRole("status");
    expect(within(done).getByRole("link", { name: /Vào nhóm Zalo workshop/ })).toHaveAttribute("href", ZALO);
  });
});
