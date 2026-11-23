export const COURSE_LEVEL: Record<string, string> = { "co-ban": "Cơ bản", "nang-cao": "Nâng cao", "chung-chi": "Luyện thi chứng chỉ", workshop: "Workshop trải nghiệm" };
export const COURSE_FORMAT: Record<string, string> = { "truc-tiep": "Học trực tiếp", online: "Học online", "ket-hop": "Kết hợp" };

/** A real sequence (spec §8.4); legal facts are not invented, so each step is "Đang cập nhật" where unverified. */
export const CERTIFICATE_STEPS = [
  { title: "Học lý thuyết an toàn bay", text: "Kiến thức về luật bay, khu vực bay, thời tiết và xử lý sự cố.", status: "Đang cập nhật" },
  { title: "Luyện bay mô phỏng", text: "Tập các bài bay cơ bản trên trình mô phỏng trước khi bay thật.", status: "Có thể bắt đầu ngay", href: "/bay-mo-phong" },
  { title: "Thực hành bay có hướng dẫn", text: "Bay thực tế cùng huấn luyện viên theo giáo trình của khóa học.", status: "Đang cập nhật" },
  { title: "Thi và nhận chứng chỉ", text: "Yêu cầu, đơn vị cấp và thủ tục thi đang được xác minh.", status: "Đang cập nhật" },
];
