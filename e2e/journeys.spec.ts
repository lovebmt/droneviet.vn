import { expect, test } from "@playwright/test";
import { API, signInAs, unique } from "./helpers";

test("a school requests a quote for a combo", async ({ page }) => {
  await page.goto("/cua-hang/combo/combo-lop-hoc-quoc-te");
  await page.getByRole("link", { name: "Nhận tư vấn & báo giá" }).first().click();
  await expect(page).toHaveURL(/\/bao-gia\?san-pham=combo-lop-hoc-quoc-te/);
  const school = `Trường E2E ${unique()}`;
  await page.getByLabel(/Tên trường hoặc đơn vị/).fill(school);
  await page.getByLabel(/Người liên hệ/).fill("Cô Lan");
  await page.getByLabel(/Số điện thoại/).fill("0912345678");
  await page.getByLabel("Số học sinh").fill("24");
  await page.getByRole("button", { name: "Gửi yêu cầu báo giá" }).click();
  await expect(page.getByText("Đã gửi yêu cầu báo giá")).toBeVisible();
});

test("a visitor buys a drone with COD and staff confirm it", async ({ page, browser }) => {
  await page.goto("/cua-hang/dv-code-fleet");
  await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
  await page.getByRole("link", { name: "Xem giỏ hàng" }).click();
  await expect(page.getByRole("heading", { name: "Giỏ hàng" })).toBeVisible();
  await page.getByRole("link", { name: "Tiến hành đặt hàng" }).click();
  await page.getByLabel(/Họ và tên/).fill("Khách E2E");
  await page.getByLabel(/Số điện thoại/).fill("0987654321");
  await page.getByLabel(/Địa chỉ giao hàng/).fill("1 Lê Lợi, Huế");
  await page.getByLabel(/Thanh toán khi nhận hàng/).check();
  await page.getByRole("button", { name: /^Đặt hàng$/ }).click();
  const placed = page.getByRole("status").filter({ hasText: "Đã đặt hàng" });
  await expect(placed).toBeVisible();
  const orderNumber = (await placed.locator("strong").textContent())!.trim();
  await expect(page.getByRole("link", { name: /Giỏ hàng, 0 sản phẩm/ })).toBeVisible();

  const staff = await browser.newContext();
  await signInAs(staff.request, "admin@droneviet.vn", "admin123");
  const admin = await staff.newPage();
  await admin.goto("/admin/don-hang");
  const row = admin.getByRole("group", { name: `Đơn ${orderNumber}` });
  await row.getByRole("button", { name: "Xác nhận đơn COD" }).click();
  await expect(row.getByRole("button", { name: "Bắt đầu đóng gói" })).toBeVisible();
  await staff.close();
});

test("a new customer signs up and sees their account", async ({ page }) => {
  const email = `e2e-${unique()}@example.com`;
  await page.goto("/dang-ky?tiep=%2Ftai-khoan%2Fdon-hang");
  await page.getByLabel(/Họ và tên/).fill("Học viên E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Mật khẩu/).fill("mat-khau-dai-12345");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page).toHaveURL(/\/tai-khoan\/don-hang$/);
  await expect(page.getByText("Bạn chưa có đơn hàng nào")).toBeVisible();
  await page.goto("/tai-khoan");
  await expect(page.getByText(email)).toBeVisible();
});

test("an R&D article renders with its table of contents", async ({ page }) => {
  await page.goto("/r-d");
  await page.getByRole("link", { name: /Thiết kế giáo trình drone/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Thiết kế giáo trình drone/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /DV Primary Lab/ }).first()).toBeVisible();
});

test("the simulator loads its engine only after start", async ({ page }) => {
  const engine: string[] = [];
  page.on("request", (r) => r.resourceType() === "script" && engine.push(r.url()));
  await page.goto("/bay-mo-phong");
  await page.waitForLoadState("networkidle");
  const before = engine.length;
  await page.getByRole("button", { name: /Bắt đầu Cất cánh/ }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
  expect(engine.length).toBeGreaterThan(before);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1500);
  await page.keyboard.up("KeyW");
  await expect(page.getByRole("dialog", { name: /Bay mô phỏng/ })).toContainText(/cao [1-9]/);
  await page.getByRole("button", { name: "Thoát bay mô phỏng" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("API health: catalog lists products by kind", async ({ request }) => {
  const res = await request.get(`${API}/catalog/products?kind=combo`);
  expect(res.ok()).toBeTruthy();
  expect(((await res.json()) as unknown[]).length).toBeGreaterThan(0);
});
