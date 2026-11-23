import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
const path = vi.hoisted(() => ({ value: "/admin" }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => path.value }));

const { default: AdminLayout } = await import("./layout");
const { default: AdminHome } = await import("./page");

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
let me: Response | null;
let fetchMock: ReturnType<typeof vi.fn>;

function renderAdmin() {
  return render(<AppProviders><AdminLayout><AdminHome /></AdminLayout></AppProviders>);
}

beforeEach(() => {
  router.replace.mockReset();
  path.value = "/admin";
  me = null;
  fetchMock = vi.fn(async (url: string) => {
    const p = new URL(url).pathname;
    if (p === "/auth/me") return me ?? json({}, 401);
    if (p === "/admin/quotes") return json([{ id: "q", status: "new" }]);
    if (p === "/admin/orders") return json([]);
    if (p === "/admin/content/articles") return json([]);
    return json([], 200);
  });
  vi.stubGlobal("fetch", fetchMock);
});

const adminCalls = () => fetchMock.mock.calls.map(([u]) => new URL(u as string).pathname).filter((p) => p.startsWith("/admin"));

describe("admin shell", () => {
  it("signed-out goes to sign-in", async () => {
    renderAdmin();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dang-nhap?tiep=%2Fadmin"));
  });

  it("customer sees no-access and no admin request", async () => {
    me = json({ id: "u", email: "c@x.vn", displayName: null, roles: ["customer"] });
    renderAdmin();
    expect(await screen.findByText("Không có quyền truy cập")).toBeInTheDocument();
    expect(adminCalls()).toEqual([]);
  });

  it("nav shows only sections the role allows", async () => {
    me = json({ id: "u", email: "s@x.vn", displayName: "Sales", roles: ["sales"] });
    renderAdmin();
    const nav = await screen.findByRole("navigation", { name: "Quản trị" });
    expect(within(nav).getByRole("link", { name: "Báo giá" })).toHaveAttribute("href", "/admin/bao-gia");
    expect(within(nav).queryByRole("link", { name: "Sản phẩm & combo" })).not.toBeInTheDocument();
    expect(await screen.findByText("1 yêu cầu mới")).toBeInTheDocument();
    expect(adminCalls()).not.toContain("/admin/orders");
  });
});
