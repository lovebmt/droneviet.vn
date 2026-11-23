/** Giáo dục hub copy (spec §8.2). Descriptive only: no invented numbers, prices or partner names. */
export const OFFER = [
  { icon: "Plane", title: "Thiết bị theo cấp học", text: "Drone, bộ lắp ráp và phụ kiện được chọn theo độ tuổi và mục tiêu của lớp." },
  { icon: "BookOpen", title: "Giáo trình song ngữ", text: "Bài học theo tuần, phiếu học tập và dự án nhóm bằng tiếng Việt và tiếng Anh." },
  { icon: "GraduationCap", title: "Đào tạo giáo viên", text: "Giáo viên được hướng dẫn vận hành, dạy và đảm bảo an toàn khi bay." },
  { icon: "LifeBuoy", title: "Hỗ trợ cả năm học", text: "Hỗ trợ kỹ thuật, phụ tùng thay thế và cập nhật học liệu khi trường cần." },
] as const;

export const INTERNATIONAL = {
  title: "Chương trình cho lớp quốc tế",
  lead: "Học liệu tiếng Anh, dự án theo chuẩn STEM và đánh giá theo năng lực, phù hợp lớp song ngữ và trường quốc tế.",
  points: ["Giáo trình và phiếu học tập song ngữ", "Dự án nhóm có thuyết trình bằng tiếng Anh", "Combo thiết bị trọn bộ cho một lớp"],
  comboSlug: "combo-lop-hoc-quoc-te",
};

export const SCHOOL_FAQ = [
  { q: "Trường cần chuẩn bị gì trước khi triển khai?", a: "Một phòng học hoặc sân đủ rộng để bay an toàn và giáo viên phụ trách. Drone Việt khảo sát và tư vấn bố trí cụ thể." },
  { q: "Có xuất hóa đơn VAT và hỗ trợ hồ sơ mua sắm không?", a: "Đang cập nhật. Liên hệ Drone Việt để được tư vấn theo quy trình của trường." },
  { q: "Giáo viên chưa từng dạy drone có dạy được không?", a: "Có. Mỗi combo đi kèm buổi đào tạo giáo viên và giáo trình theo tuần để giáo viên tự tin đứng lớp." },
  { q: "Thiết bị hỏng thì xử lý thế nào?", a: "Drone Việt cung cấp linh kiện thay thế và hướng dẫn sửa chữa. Chính sách bảo hành chi tiết đang cập nhật." },
];
