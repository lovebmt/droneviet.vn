import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

describe("SiteFooter legal links", () => {
  it("links the privacy policy and terms from every page (required by Google OAuth verification)", () => {
    render(<SiteFooter brandName="Drone Việt" tagline="t" navigation={[]} />);

    expect(screen.getByRole("link", { name: "Chính sách bảo mật" })).toHaveAttribute("href", "/chinh-sach-bao-mat");
    expect(screen.getByRole("link", { name: "Điều khoản sử dụng" })).toHaveAttribute("href", "/dieu-khoan-su-dung");
  });

  it("uses English labels on the English site", () => {
    render(<SiteFooter brandName="Drone Viet" tagline="t" navigation={[]} locale="en" />);

    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/chinh-sach-bao-mat");
    expect(screen.getByRole("link", { name: "Terms of use" })).toHaveAttribute("href", "/dieu-khoan-su-dung");
  });
});
