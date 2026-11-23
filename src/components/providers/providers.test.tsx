import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginCustomer } from "@/lib/commerce/customer-auth";
import { CartProvider, useCart } from "./cart-provider";
import { SessionProvider, useSession } from "./session-provider";

const line = { variantId: "v1", slug: "dv-mini", name: "DV Mini", priceVnd: 2_490_000, quantity: 1, imageUrl: null };

function CartProbe() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="count">{cart.count}</span>
      <span data-testid="total">{cart.totalVnd}</span>
      <button onClick={() => cart.add(line)}>add</button>
    </div>
  );
}

function SessionProbe() {
  const session = useSession();
  return (
    <div>
      <span data-testid="status">{session.status}</span>
      <span data-testid="email">{session.user?.email ?? ""}</span>
      <button onClick={() => void session.logout()}>logout</button>
    </div>
  );
}

describe("CartProvider", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("cart persists lines and restores them on reload", async () => {
    const first = render(<CartProvider><CartProbe /></CartProvider>);
    act(() => screen.getByText("add").click());
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    first.unmount();

    render(<CartProvider><CartProbe /></CartProvider>);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
  });

  it("adding the same variant increases quantity", () => {
    render(<CartProvider><CartProbe /></CartProvider>);
    act(() => screen.getByText("add").click());
    act(() => screen.getByText("add").click());
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("total")).toHaveTextContent(String(2 * 2_490_000));
  });

  it("corrupt or blocked localStorage yields an empty cart", () => {
    localStorage.setItem("dv-cart-v2", "{not json");
    const first = render(<CartProvider><CartProbe /></CartProvider>);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    first.unmount();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<CartProvider><CartProbe /></CartProvider>);
    act(() => screen.getByText("add").click());
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});

describe("SessionProvider", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("session is signed-out on 401 and signed-in with the user on 200", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    const first = render(<SessionProvider><SessionProbe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
    first.unmount();

    const fetchMock = vi.fn(async () => Response.json({ id: "u1", email: "an@example.com", displayName: "An", roles: ["customer"] }));
    vi.stubGlobal("fetch", fetchMock);
    render(<SessionProvider><SessionProbe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId("email")).toHaveTextContent("an@example.com"));
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/auth/me", expect.objectContaining({ credentials: "include" }));
  });

  it("logout clears the user", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      String(url).endsWith("/auth/logout") ? Response.json({ ok: true }) : Response.json({ id: "u1", email: "an@example.com", displayName: null, roles: [] })));
    render(<SessionProvider><SessionProbe /></SessionProvider>);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-in"));
    act(() => screen.getByText("logout").click());
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
  });
});

describe("customer auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends credentials so the browser stores the session cookie", async () => {
    vi.stubEnv("NEXT_PUBLIC_COMMERCE_API_URL", "https://api.test");
    const fetchMock = vi.fn(async () => Response.json({ accessToken: "t", user: { id: "u", email: "a@b.c", roles: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    await loginCustomer("a@b.c", "Password-123456");
    expect(fetchMock).toHaveBeenCalledWith("https://api.test/auth/login", expect.objectContaining({ credentials: "include", method: "POST" }));
  });
});
