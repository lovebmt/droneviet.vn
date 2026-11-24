/** Vietnamese labels for article tags (front matter `tags`). Every tag used in content/rd needs one. */
export const TAG_LABEL: Record<string, string> = {
  "lap-rap": "Lắp ráp",
  "lap-trinh": "Lập trình",
  "cam-bien": "Cảm biến",
  "giao-duc": "Giáo dục",
  "an-toan": "An toàn",
  stem: "STEM",
  "nghien-cuu": "Nghiên cứu",
  "giao-trinh": "Giáo trình",
  "vat-ly": "Vật lý",
  "dieu-khien": "Điều khiển",
  "mo-phong": "Mô phỏng",
  ai: "AI",
  "ung-dung": "Ứng dụng",
  "giao-vien": "Giáo viên",
  "bai-mau": "Bài mẫu",
};

export const tagLabel = (tag: string) => TAG_LABEL[tag] ?? tag.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
