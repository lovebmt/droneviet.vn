import { expect, test } from "@playwright/test";
import { API, signInAs, unique } from "./helpers";

test("a school registers for a workshop and is offered the Zalo group", async ({ page, browser }) => {
  const zalo = `https://zalo.me/g/e2e-${unique()}`;
  const staff = await browser.newContext();
  await signInAs(staff.request, "admin@droneviet.vn", "admin123");
  expect((await staff.request.patch(`${API}/admin/courses/workshop-trai-nghiem-drone`, { data: { zaloGroupUrl: zalo } })).ok()).toBeTruthy();
  await staff.close();

  await page.goto("/giao-duc/workshop");
  await expect(page.getByRole("heading", { level: 1, name: "Workshop trải nghiệm drone" })).toBeVisible();
  const sessions = page.getByRole("radiogroup", { name: "Chọn buổi workshop" });
  await expect(sessions.getByText(/^Thứ Bảy, /)).toBeVisible();
  await expect(sessions.getByText(/^Chủ Nhật, /)).toBeVisible();
  await expect(sessions.getByText("9:00")).toHaveCount(2);
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

test("flight zone page sends people to the official map", async ({ page }) => {
  await page.goto("/dao-tao/ban-do");
  await expect(page.getByRole("heading", { level: 1, name: "Bản đồ khu vực bay" })).toBeVisible();
  await expect(page.locator('a[href="https://cambay.mod.gov.vn"]').first()).toBeVisible();
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
});
