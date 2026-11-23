import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PayosService } from "./payos.service";

const fetchMock = vi.fn();

describe("PayosService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a signed PayOS checkout request with a safe transfer description", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      json: async () => ({
        code: "00",
        data: { checkoutUrl: "https://pay.payos.vn/web/checkout" },
      }),
      ok: true,
    });
    const config = {
      get: vi.fn((key: string, fallback = "") => {
        const values: Record<string, string> = {
          PAYOS_API_KEY: "api-key",
          PAYOS_CANCEL_URL: "https://store.example/thanh-toan/huy",
          PAYOS_CHECKSUM_KEY: "checksum-key",
          PAYOS_CLIENT_ID: "client-id",
          PAYOS_RETURN_URL: "https://store.example/thanh-toan/thanh-cong",
        };

        return values[key] ?? fallback;
      }),
    };
    const service = new PayosService(config as never);

    await expect(
      service.createPaymentLink({
        amountVnd: 9_500_000,
        description: "Đơn hàng DV Primary Lab #1",
        orderCode: 123456,
      }),
    ).resolves.toBe("https://pay.payos.vn/web/checkout");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-merchant.payos.vn/v2/payment-requests",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-api-key": "api-key",
          "x-client-id": "client-id",
        }),
        method: "POST",
      }),
    );
    expect(
      service.verifyWebhookSignature(
        { amount: 9_500_000, orderCode: 123456, status: "PAID" },
        "invalid",
      ),
    ).toBe(false);
  });

  it("verifies a real-shaped bank transfer webhook whose empty fields PayOS signs as key=", () => {
    const data = {
      accountNumber: "473327",
      amount: 9_500_000,
      code: "00",
      counterAccountBankId: "",
      counterAccountBankName: "",
      counterAccountName: null,
      counterAccountNumber: "",
      currency: "VND",
      desc: "success",
      description: "DV123456",
      orderCode: 123456,
      paymentLinkId: "f7acaaac718043338f130a8d5bf9babc",
      reference: "FT26327",
      transactionDateTime: "2026-11-23 10:00:00",
      virtualAccountName: "",
      virtualAccountNumber: "",
    };
    // Written out by hand from PayOS's rule: every key, sorted, null/"" rendered empty.
    const signed =
      "accountNumber=473327&amount=9500000&code=00&counterAccountBankId=&counterAccountBankName=" +
      "&counterAccountName=&counterAccountNumber=&currency=VND&desc=success&description=DV123456" +
      "&orderCode=123456&paymentLinkId=f7acaaac718043338f130a8d5bf9babc&reference=FT26327" +
      "&transactionDateTime=2026-11-23 10:00:00&virtualAccountName=&virtualAccountNumber=";
    const signature = createHmac("sha256", "checksum-key").update(signed).digest("hex");
    const config = { get: vi.fn((key: string) => (key === "PAYOS_CHECKSUM_KEY" ? "checksum-key" : "")) };
    const service = new PayosService(config as never);

    expect(service.verifyWebhookSignature(data, signature)).toBe(true);
    expect(service.verifyWebhookSignature({ ...data, amount: 1 }, signature)).toBe(false);
  });
});
