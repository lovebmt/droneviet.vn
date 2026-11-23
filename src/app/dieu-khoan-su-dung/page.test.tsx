import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TermsPage, { metadata } from "./page";

describe("TermsPage", () => {
  it("covers accounts, orders, the 30-minute stock hold, flight law and links to the privacy policy", () => {
    render(<TermsPage />);
    const text = document.body.textContent ?? "";

    expect(screen.getByRole("heading", { level: 1, name: "Điều khoản sử dụng" })).toBeInTheDocument();
    expect(text).toContain("30 phút");
    expect(text).toContain("PayOS");
    expect(text).toContain("quy định pháp luật Việt Nam về quản lý hoạt động bay");
    expect(text.length).toBeGreaterThan(2500);
    expect(screen.getByRole("link", { name: "Chính sách bảo mật" })).toHaveAttribute("href", "/chinh-sach-bao-mat");
    expect(metadata.alternates?.canonical).toBe("https://www.droneviet.vn/dieu-khoan-su-dung");
  });
});
