import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPolicyPage, { metadata } from "./page";

function pageText() {
  render(<PrivacyPolicyPage />);
  return document.body.textContent ?? "";
}

describe("PrivacyPolicyPage (Google OAuth branding verification)", () => {
  it("has a titled, dated policy with enough substance for Google's review", () => {
    const text = pageText();

    expect(screen.getByRole("heading", { level: 1, name: "Chính sách bảo mật" })).toBeInTheDocument();
    expect(text).toContain("Có hiệu lực từ 23/11/2026");
    expect(text.length).toBeGreaterThan(4000);
    expect(metadata.alternates?.canonical).toBe("https://www.droneviet.vn/chinh-sach-bao-mat");
  });

  it("lists exactly the data the site collects and why", () => {
    const text = pageText();

    for (const phrase of ["Họ tên", "số điện thoại", "địa chỉ giao hàng", "email", "mã hóa mật khẩu (bcrypt)"]) {
      expect(text.toLowerCase()).toContain(phrase.toLowerCase());
    }
    expect(text).toContain("không sử dụng cookie quảng cáo");
  });

  it("explains Google and Zalo sign-in data, the Limited Use commitment and how to revoke access", () => {
    const text = pageText();

    expect(text).toContain("openid, email và profile");
    expect(text).toContain("Google API Services User Data Policy");
    expect(text).toContain("Limited Use");
    expect(text).toContain("https://myaccount.google.com/permissions");
    expect(text).toContain("Zalo");
  });

  it("names the third parties data is shared with and never claims a sale of data", () => {
    const text = pageText();

    for (const party of ["PayOS", "Vercel", "Neon", "Cloudflare", "đơn vị vận chuyển"]) {
      expect(text).toContain(party);
    }
    expect(text).toContain("không bán dữ liệu cá nhân");
  });

  it("states user rights under Decree 13/2023 and how to reach us", () => {
    render(<PrivacyPolicyPage />);

    expect(document.body.textContent).toContain("Nghị định 13/2023/NĐ-CP");
    expect(screen.getAllByRole("link", { name: /Zalo 0384070636/ })[0]).toHaveAttribute(
      "href",
      "https://zalo.me/0384070636",
    );
  });
});
