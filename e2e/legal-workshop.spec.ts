import { expect, test } from "@playwright/test";
import { API, signInAs, unique } from "./helpers";

test("a school registers for a workshop and is offered the Zalo group", async ({ page, browser }) => {
  const zalo = `https://zalo.me/g/e2e-${unique()}`;
  const staff = await browser.newContext();
  await signInAs(staff.request, "admin@droneviet.vn", "admin123");
  expect((await staff.request.patch(`${API}/admin/courses/workshop-trai-nghiem-drone`, { data: { zaloGroupUrl: zalo } })).ok()).toBeTruthy();
  const startsAt = new Date(Date.now() + 10 * 86_400_000).toISOString();
  expect((await staff.request.post(`${API}/admin/courses/workshop-trai-nghiem-drone/sessions`, { data: { startsAt, capacity: 40 } })).ok()).toBeTruthy();
  await staff.close();

  await page.goto("/giao-duc/workshop");
  await expect(page.getByRole("heading", { level: 1, name: "Workshop trải nghiệm drone" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Chọn buổi workshop" })).toBeVisible();
  await page.getByLabel(/Họ và tên/).fill("Cô Lan");
  await page.getByLabel(/Số điện thoại/).fill("0912345678");
  await page.getByLabel(/Trường hoặc đơn vị/).fill(`THCS E2E ${unique()}`);
  await page.getByLabel(/Số người tham gia/).fill("3");
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page.getByRole("status").getByRole("link", { name: /Vào nhóm Zalo workshop/ })).toHaveAttribute("href", zalo);
});

test("legal pages show their summary and link each other", async ({ page }) => {
  for (const [path, title] of [["/dao-tao/chung-chi", "Chứng chỉ, giấy phép bay"], ["/dao-tao/cap-phep", "Cấp phép bay"], ["/dao-tao/quy-dinh", "Quy định pháp lý"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tóm tắt nhanh" })).toBeVisible();
    await expect(page.locator('a[href="/dao-tao/ban-do"]').first()).toBeAttached();
  }
});

test("flight map loads leaflet only on the map page and shows the sovereignty labels", async ({ page }) => {
  const leafletIn = async (path: string) => {
    const bodies: Promise<string>[] = [];
    const listener = (r: import("@playwright/test").Response) => {
      if (r.request().resourceType() === "script") bodies.push(r.text().catch(() => ""));
    };
    page.on("response", listener);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    page.off("response", listener);
    return (await Promise.all(bodies)).some((b) => b.includes("leafletjs.com"));
  };
  expect(await leafletIn("/dao-tao/quy-dinh")).toBe(false);
  expect(await leafletIn("/dao-tao/ban-do")).toBe(true);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.getByText("Quần đảo Hoàng Sa (Việt Nam)")).toBeVisible();
  await expect(page.getByText("Quần đảo Trường Sa (Việt Nam)")).toBeVisible();
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeAttached();
  await page.locator(".leaflet-container").click({ position: { x: 200, y: 150 } });
  await expect(page.getByRole("status")).toBeVisible();
});
