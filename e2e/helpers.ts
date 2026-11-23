import { type APIRequestContext, expect, type Page } from "@playwright/test";

export const API = process.env.E2E_API_URL ?? "http://localhost:4000";

/** Signs in through the API so the dv_session cookie lands in the browser context. */
export async function signInAs(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `login ${email}`).toBeTruthy();
}

export async function noHorizontalOverflow(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(scroll, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(client);
}

export const unique = () => Math.random().toString(36).slice(2, 8);
