import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUserContext } from "@/components/admin/admin-context";
import { AppProviders } from "@/components/providers/app-providers";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/admin" }));
const { default: CoursesPage } = await import("./khoa-hoc/page");
const { default: ArticlesPage } = await import("./bai-viet/page");
const { default: SettingsPage } = await import("./cai-dat/page");
const { default: MediaPage } = await import("./media/page");

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const staff = { id: "a", email: "a@x.vn", displayName: "Admin", roles: ["super_admin"] };
let calls: Array<{ method: string; path: string; body: unknown }>;

beforeEach(() => {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? "GET";
    const body = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, body });
    if (path === "/admin/courses" && method === "GET") return json([{ id: "c1", slug: "bay-co-ban", title: "Bay cơ bản", level: "workshop", summary: "Bay thử", descriptionMarkdown: null, zaloGroupUrl: null, sessions: [{ id: "s1", startsAt: "2026-12-05T01:00:00.000Z", capacity: 10, reservedSeats: 2, status: "open", enrollments: 2 }] }]);
    if (path === "/admin/course-sessions/s1/enrollments") return json([{ id: "e1", contactName: "Học viên A", contactPhone: "0900000001", contactEmail: null, status: "reserved", quantity: 1, organization: null, note: null }, { id: "e2", contactName: "Cô Lan", contactPhone: "0900000002", contactEmail: null, status: "reserved", quantity: 12, organization: "THCS Nguyễn Du", note: "Lớp 7A" }]);
    if (path === "/admin/content/articles") return json([{ slug: "lap-rap-f450", title: "Lắp ráp F450", status: "published", publishedAt: "2026-11-20T00:00:00.000Z", updatedAt: "2026-11-20T00:00:00.000Z", tags: [] }]);
    if (path === "/settings/public") return json({ contact: { zalo: "0384070636", phone: null, email: null, address: null, companyName: null }, announcement: null });
    if (path === "/admin/media" && method === "GET") return json([{ id: "m1", url: "http://localhost:4000/media/m1/anh.webp", filename: "anh.webp", mime: "image/webp", bytes: 2048, alt: "Ảnh", source: null, createdAt: "2026-11-23T00:00:00.000Z" }]);
    return json({ ok: true, status: body?.status });
  }));
});

const wrap = (ui: React.ReactNode) => render(<AppProviders><AdminUserContext.Provider value={staff}>{ui}</AdminUserContext.Provider></AppProviders>);

describe("admin courses", () => {
  it("staff see the school, group size and note of a registration", async () => {
    wrap(<CoursesPage />);
    const course = await screen.findByRole("region", { name: "Bay cơ bản" });
    await act(async () => fireEvent.click(within(course).getByRole("button", { name: /Xem học viên/ })));
    const row = (await within(course).findByText("Cô Lan")).closest("li")!;
    expect(row).toHaveTextContent("THCS Nguyễn Du");
    expect(row).toHaveTextContent("12 người");
    expect(row).toHaveTextContent("Lớp 7A");
  });

  it("staff set the Zalo group link of a course", async () => {
    wrap(<CoursesPage />);
    const course = await screen.findByRole("region", { name: "Bay cơ bản" });
    fireEvent.change(within(course).getByLabelText(/Link nhóm Zalo/), { target: { value: "https://zalo.me/g/workshop" } });
    await act(async () => fireEvent.click(within(course).getByRole("button", { name: "Lưu thông tin khóa" })));
    const patch = calls.find((c) => c.method === "PATCH" && c.path === "/admin/courses/bay-co-ban")!;
    expect(patch.body).toMatchObject({ zaloGroupUrl: "https://zalo.me/g/workshop", summary: "Bay thử" });
  });

  it("add session posts startsAt and capacity", async () => {
    wrap(<CoursesPage />);
    const course = await screen.findByRole("region", { name: "Bay cơ bản" });
    fireEvent.change(within(course).getByLabelText("Ngày giờ khai giảng"), { target: { value: "2026-12-20T08:00" } });
    fireEvent.change(within(course).getByLabelText("Số chỗ"), { target: { value: "15" } });
    await act(async () => fireEvent.click(within(course).getByRole("button", { name: "Mở lịch học" })));
    const post = calls.find((c) => c.method === "POST" && c.path === "/admin/courses/bay-co-ban/sessions")!;
    expect(post.body).toMatchObject({ capacity: 15 });
    expect(new Date((post.body as { startsAt: string }).startsAt).toISOString()).toBe("2026-12-20T01:00:00.000Z");
  });

  it("enrollments can be confirmed", async () => {
    wrap(<CoursesPage />);
    const course = await screen.findByRole("region", { name: "Bay cơ bản" });
    await act(async () => fireEvent.click(within(course).getByRole("button", { name: /Xem học viên/ })));
    await act(async () => fireEvent.click(await within(course).findByRole("button", { name: "Xác nhận Học viên A" })));
    expect(calls.find((c) => c.method === "PATCH" && c.path === "/admin/enrollments/e1")?.body).toEqual({ status: "confirmed" });
  });
});

describe("admin articles", () => {
  it("unpublish calls the API", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    wrap(<ArticlesPage />);
    const row = await screen.findByRole("group", { name: "Lắp ráp F450" });
    await act(async () => fireEvent.click(within(row).getByRole("button", { name: "Ẩn bài" })));
    expect(calls.some((c) => c.method === "POST" && c.path === "/admin/content/articles/lap-rap-f450/unpublish")).toBe(true);
  });
});

describe("admin settings", () => {
  it("settings save contact fields", async () => {
    wrap(<SettingsPage />);
    const form = await screen.findByRole("region", { name: "Liên hệ" });
    fireEvent.change(within(form).getByLabelText("Email"), { target: { value: "hello@droneviet.vn" } });
    await act(async () => fireEvent.click(within(form).getByRole("button", { name: "Lưu liên hệ" })));
    expect(calls.find((c) => c.method === "PATCH" && c.path === "/admin/settings/contact")?.body).toEqual({
      value: { zalo: "0384070636", phone: null, email: "hello@droneviet.vn", address: null, companyName: null },
    });
  });
});

describe("admin media", () => {
  it("media library lists files with their URL", async () => {
    wrap(<MediaPage />);
    expect(await screen.findByDisplayValue("http://localhost:4000/media/m1/anh.webp")).toBeInTheDocument();
  });
});
