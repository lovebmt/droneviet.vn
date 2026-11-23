import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import type { CourseDetail } from "@/lib/api/types";
import { DEFAULT_SETTINGS } from "@/lib/api/types";
import { comboTieuHoc } from "@/test/fixtures";

const api = vi.hoisted(() => ({ listProducts: vi.fn(), listCourses: vi.fn(), getCourse: vi.fn(), getSettings: vi.fn(), listArticles: vi.fn() }));
vi.mock("@/lib/api/server", () => api);
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { default: EducationPage } = await import("./giao-duc/page");
const { default: LevelPage } = await import("./giao-duc/[cap]/page");
const { default: CoursePage } = await import("./dao-tao/[slug]/page");
const { default: SupportPage } = await import("./ho-tro/page");
const { default: TrainingPage } = await import("./dao-tao/page");

const course: CourseDetail = {
  slug: "drone-nhap-mon-cap-1", title: "Drone nhập môn cho cấp 1", summary: "An toàn bay", level: "co-ban", format: "truc-tiep",
  durationHours: 12, tuitionVnd: 2_400_000, certificateTrack: "lam-quen", descriptionMarkdown: "Nội dung khóa học",
  sessions: [
    { id: "11111111-1111-4111-8111-111111111111", startsAt: "2026-12-05T01:00:00.000Z", capacity: 20, seatsLeft: 7 },
    { id: "22222222-2222-4222-8222-222222222222", startsAt: "2026-12-12T01:00:00.000Z", capacity: 20, seatsLeft: 0 },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn(async () => new Response("{}", { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);
  api.listProducts.mockReset().mockResolvedValue([]);
  api.listArticles.mockResolvedValue([]);
  api.getSettings.mockResolvedValue({ ...DEFAULT_SETTINGS, contact: { ...DEFAULT_SETTINGS.contact, email: "hello@droneviet.vn" } });
  api.getCourse.mockResolvedValue(course);
});

describe("education", () => {
  it("education hub links the four levels and the quote form", async () => {
    render(<AppProviders>{await EducationPage()}</AppProviders>);
    for (const slug of ["tieu-hoc", "thcs", "thpt", "dai-hoc"]) {
      expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === `/giao-duc/${slug}`)).toBe(true);
    }
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href")?.startsWith("/bao-gia"))).toBe(true);
  });

  it("education hub links the workshop page", async () => {
    render(<AppProviders>{await EducationPage()}</AppProviders>);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/giao-duc/workshop")).toBe(true);
  });

  it("training list leaves workshops to the education section", async () => {
    api.listCourses.mockResolvedValue([
      { ...course, sessions: undefined },
      { ...course, slug: "workshop-trai-nghiem-drone", title: "Workshop trải nghiệm drone", level: "workshop", sessions: undefined },
    ]);
    render(<AppProviders>{await TrainingPage()}</AppProviders>);
    expect(screen.getByRole("link", { name: /Drone nhập môn cho cấp 1/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Workshop trải nghiệm drone/ })).not.toBeInTheDocument();
  });

  it("unknown level is 404", async () => {
    await expect(LevelPage({ params: Promise.resolve({ cap: "mau-giao" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("level page lists combos for that level", async () => {
    api.listProducts.mockImplementation(async (kind: string, opts?: { level?: string }) => (kind === "combo" && opts?.level === "tieu-hoc" ? [comboTieuHoc] : []));
    render(<AppProviders>{await LevelPage({ params: Promise.resolve({ cap: "tieu-hoc" }) })}</AppProviders>);
    expect(screen.getByRole("heading", { level: 1, name: /Tiểu học/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Combo Tiểu học/ })).toHaveAttribute("href", "/cua-hang/combo/combo-tieu-hoc");
  });
});

describe("training", () => {
  it("course page lists sessions with seats left", async () => {
    render(<AppProviders>{await CoursePage({ params: Promise.resolve({ slug: course.slug }) })}</AppProviders>);
    expect(screen.getByRole("heading", { level: 1, name: course.title })).toBeInTheDocument();
    const sessions = screen.getByRole("radiogroup", { name: "Chọn lịch học" });
    expect(within(sessions).getByText("Còn 7 chỗ")).toBeInTheDocument();
    expect(within(sessions).getByText("Đã đủ chỗ")).toBeInTheDocument();
    expect(within(sessions).getAllByRole("radio")[1]).toBeDisabled();
  });

  it("enroll form reports a full session", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith("/enroll") ? new Response(JSON.stringify({ message: "Session is full" }), { status: 409 }) : new Response("{}", { status: 401 }),
    );
    render(<AppProviders>{await CoursePage({ params: Promise.resolve({ slug: course.slug }) })}</AppProviders>);
    fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: "Nguyễn An" } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/), { target: { value: "0912345678" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Giữ chỗ" })));
    expect(await screen.findByRole("alert")).toHaveTextContent("Lịch học này vừa đủ chỗ");
  });
});

describe("support", () => {
  it("support page shows contact from settings", async () => {
    render(<AppProviders>{await SupportPage()}</AppProviders>);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "https://zalo.me/0384070636")).toBe(true);
    expect(screen.getAllByText("hello@droneviet.vn").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Tra cứu đơn hàng" })).toBeInTheDocument();
  });
});
