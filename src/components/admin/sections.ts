/** Admin sections and the roles that may open them (mirrors backend @Roles). */
export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Tổng quan", roles: ["super_admin", "catalog_manager", "operations", "sales", "instructor", "support"] },
  { href: "/admin/san-pham", label: "Sản phẩm & combo", roles: ["super_admin", "catalog_manager"] },
  { href: "/admin/don-hang", label: "Đơn hàng", roles: ["super_admin", "operations"] },
  { href: "/admin/bao-gia", label: "Báo giá", roles: ["super_admin", "sales"] },
  { href: "/admin/khoa-hoc", label: "Khóa học", roles: ["super_admin", "instructor"] },
  { href: "/admin/bai-viet", label: "Bài viết", roles: ["super_admin", "catalog_manager"] },
  { href: "/admin/media", label: "Media", roles: ["super_admin", "catalog_manager"] },
  { href: "/admin/cai-dat", label: "Cài đặt", roles: ["super_admin"] },
] as const;

export type AdminHref = (typeof ADMIN_SECTIONS)[number]["href"];

export function canOpen(roles: readonly string[], href: AdminHref): boolean {
  const section = ADMIN_SECTIONS.find((s) => s.href === href);
  return !!section && section.roles.some((r) => roles.includes(r));
}

export function isStaff(roles: readonly string[]): boolean {
  return canOpen(roles, "/admin");
}
