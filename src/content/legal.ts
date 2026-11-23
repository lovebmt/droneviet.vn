/**
 * Legal pages under Đào tạo & chứng chỉ. The body of each page is a "phap-ly" article
 * (content/phap-ly/<articleSlug>), so it can be corrected without a deploy; the key points
 * here are the short, sourced summary shown even before the article is published.
 */
export interface LegalPage {
  href: string;
  title: string;
  lead: string;
  articleSlug: string;
  keyPoints: string[];
}

export const LEGAL_PAGES: LegalPage[] = [
  {
    href: "/dao-tao/chung-chi",
    title: "Chứng chỉ, giấy phép bay",
    lead: "Ai cần giấy phép điều khiển drone, khác nhau giữa Hạng A và Hạng B, học ở đâu và ai cấp.",
    articleSlug: "giay-phep-dieu-khien-drone",
    keyPoints: [
      "Drone từ 0,25 kg trở lên: người điều khiển phải có giấy phép (Nghị định 288/2025/NĐ-CP, Điều 19 khoản 3).",
      "Hạng A: drone dưới 2 kg, bay trong tầm nhìn. Hạng B: từ 2 kg, bay ngoài tầm nhìn hoặc theo chương trình (Điều 27 khoản 1).",
      "Bộ Quốc phòng cấp theo đề nghị của cơ sở đào tạo; giấy phép có hiệu lực 10 năm (Điều 27, 28).",
    ],
  },
  {
    href: "/dao-tao/cap-phep",
    title: "Cấp phép bay",
    lead: "Khi nào được miễn, hồ sơ gồm gì, nộp trước bao lâu và phép bay có hiệu lực bao lâu.",
    articleSlug: "cap-phep-bay-drone",
    keyPoints: [
      "Miễn xin phép: drone vui chơi dưới 0,25 kg bay ngoài khu vực cấm và hạn chế bay (Nghị định 288/2025/NĐ-CP, Điều 21 khoản 1).",
      "Nộp hồ sơ trước ít nhất 7 ngày, 12 ngày nếu cần NOTAM; trả lời trong 5 ngày làm việc (Điều 22 khoản 2).",
      "Mỗi phép bay tối đa 30 ngày, 180 ngày với công vụ, nông nghiệp, 360 ngày tại khu vực bay truyền thống (Điều 21 khoản 4).",
    ],
  },
  {
    href: "/dao-tao/quy-dinh",
    title: "Quy định pháp lý",
    lead: "Các văn bản đang áp dụng với drone, văn bản đã hết hiệu lực và lưu ý cho trường học.",
    articleSlug: "quy-dinh-phap-ly-drone",
    keyPoints: [
      "Đang áp dụng: Luật Phòng không nhân dân 2024, Nghị định 288/2025/NĐ-CP, Quyết định 18/2020/QĐ-TTg, Nghị định 282/2025/NĐ-CP (xử phạt).",
      "Nghị định 36/2008/NĐ-CP đã hết hiệu lực từ 05/11/2025 (Nghị định 288/2025/NĐ-CP, Điều 34).",
      "Drone phải được đăng ký; quy định này áp dụng từ 01/7/2026 (Điều 19 khoản 1, Điều 34 khoản 2).",
    ],
  },
  {
    href: "/dao-tao/ban-do",
    title: "Bản đồ khu vực bay",
    lead: "Tra cứu trực tiếp khu vực cấm bay và hạn chế bay trên bản đồ chính thức của Bộ Quốc phòng.",
    articleSlug: "khu-vuc-cam-bay-drone",
    keyPoints: [],
  },
];

export const legalPage = (href: string): LegalPage => LEGAL_PAGES.find((p) => p.href === href)!;
