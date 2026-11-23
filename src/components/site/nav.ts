export interface NavChild {
  label: string;
  href: string;
  description?: string;
}

/** A section with `children` is a menu: its label opens the sub-items and does not navigate. */
export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
  children?: NavChild[];
}

/** Main navigation (spec §7.5). */
export const mainNav: NavItem[] = [
  {
    label: "Giáo dục",
    href: "/giao-duc",
    children: [
      { label: "Tiểu học", href: "/giao-duc/tieu-hoc", description: "Bay an toàn, học qua trò chơi" },
      { label: "THCS", href: "/giao-duc/thcs", description: "Lắp ráp, lập trình, cảm biến" },
      { label: "THPT & quốc tế", href: "/giao-duc/thpt", description: "Dự án STEM, chương trình song ngữ" },
      { label: "Đại học & R&D", href: "/giao-duc/dai-hoc", description: "Nền tảng nghiên cứu, dữ liệu bay" },
      { label: "Workshop trải nghiệm", href: "/giao-duc/workshop", description: "Một buổi bay thử cho học sinh" },
    ],
  },
  {
    label: "Cửa hàng",
    href: "/cua-hang",
    children: [
      { label: "Tất cả sản phẩm", href: "/cua-hang", description: "Combo, drone, linh kiện" },
      { label: "Combo lớp học", href: "/cua-hang?loai=combo", description: "Trọn bộ cho một lớp, nhận báo giá" },
      { label: "Drone", href: "/cua-hang?loai=drone", description: "Drone cho học sinh và giáo viên" },
      { label: "Linh kiện & phụ kiện", href: "/cua-hang?loai=linh-kien", description: "Motor, pin, cánh quạt, mạch bay" },
      { label: "So sánh combo", href: "/cua-hang/so-sanh", description: "Chọn combo hợp với trường bạn" },
    ],
  },
  {
    label: "Đào tạo & chứng chỉ",
    href: "/dao-tao",
    children: [
      { label: "Chứng chỉ, giấy phép bay", href: "/dao-tao/chung-chi", description: "Hạng A, Hạng B, học ở đâu" },
      { label: "Cấp phép bay", href: "/dao-tao/cap-phep", description: "Hồ sơ, thời hạn, khi nào được miễn" },
      { label: "Quy định pháp lý", href: "/dao-tao/quy-dinh", description: "Văn bản đang áp dụng" },
      { label: "Bản đồ khu vực bay", href: "/dao-tao/ban-do", description: "Vùng cấm, hạn chế bay" },
    ],
  },
  { label: "R&D", href: "/r-d" },
  { label: "Bay mô phỏng", href: "/bay-mo-phong", highlight: true },
  { label: "Hỗ trợ", href: "/ho-tro" },
];
