import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { noHorizontalOverflow } from "./helpers";

const PAGES = ["/", "/giao-duc", "/giao-duc/thcs", "/cua-hang", "/cua-hang/dv-code-fleet", "/cua-hang/combo/combo-lop-hoc-quoc-te", "/cua-hang/so-sanh", "/bao-gia", "/dao-tao", "/dao-tao/chung-chi", "/r-d", "/ho-tro", "/bay-an-toan", "/bay-mo-phong", "/dang-nhap", "/gio-hang", "/tim-kiem?q=drone", "/en", "/en/education"];

test.describe("legacy URLs redirect permanently", () => {
  const cases: Array<[string, string]> = [
    ["/san-pham/dv-code-fleet", "/cua-hang/dv-code-fleet"],
    ["/san-pham", "/cua-hang"],
    ["/giai-phap", "/giao-duc"],
    ["/dich-vu", "/giao-duc"],
    ["/khoa-hoc", "/dao-tao"],
    ["/tin-tuc", "/r-d"],
    ["/theo-doi-don", "/tai-khoan/don-hang"],
  ];
  for (const [from, to] of cases) {
    test(`${from} → ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      expect(new URL(res.headers().location, "http://x").pathname).toBe(to);
    });
  }
});

test.describe("phone width", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of PAGES) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path);
      await noHorizontalOverflow(page);
    });
  }
});

test.describe("accessibility (axe, WCAG 2 A/AA)", () => {
  for (const path of PAGES) {
    test(`no serious violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).exclude("nextjs-portal").analyze();
      const serious = results.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(serious, serious.join("\n")).toEqual([]);
    });
  }

  test("every page has exactly one h1", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      expect(await page.locator("h1").count(), path).toBe(1);
    }
  });
});
