import { apiFetch } from "@/lib/api/client";
import { apiBase } from "@/lib/api/base";
export interface CustomerSession {
  accessToken: string;
  user: {
    email: string;
    id: string;
    roles: string[];
  };
}

/** Sign-in calls go through apiFetch so the browser stores the httpOnly session cookie. */
function request(path: string, payload: Record<string, string>): Promise<CustomerSession> {
  return apiFetch<CustomerSession>(path, { method: "POST", body: JSON.stringify(payload) }).catch(() => {
    throw new Error("Không thể xác thực tài khoản.");
  });
}

export function loginCustomer(email: string, password: string) {
  return request("/auth/login", { email, password });
}

export function registerCustomer(
  displayName: string,
  email: string,
  password: string,
) {
  return request("/auth/register", { displayName, email, password });
}

export type OauthProvider = "google" | "zalo";

/** Where the browser goes to start a Google/Zalo sign-in (the API redirects onward). */
export function oauthStartUrl(provider: OauthProvider): string {
  return `${apiBase()}/auth/${provider}`;
}

/** Which social sign-ins the API has credentials for; none if the API is unreachable. */
export async function fetchOauthProviders(): Promise<Record<OauthProvider, boolean>> {
  try {
    const response = await fetch(`${apiBase()}/auth/providers`);
    if (response.ok) {
      const body = (await response.json()) as Partial<Record<OauthProvider, boolean>>;
      return { google: body.google === true, zalo: body.zalo === true };
    }
  } catch {
    // Fall through: hide social buttons rather than show broken ones.
  }
  return { google: false, zalo: false };
}

export function exchangeOauthCode(code: string) {
  return request("/auth/oauth/exchange", { code });
}
