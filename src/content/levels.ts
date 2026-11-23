/** School levels (spec §8.2). Copy is descriptive; no numbers or claims that need verification. */
export type LevelSlug = "tieu-hoc" | "thcs" | "thpt" | "dai-hoc";

export interface Level {
  slug: LevelSlug;
  apiLevels: string[];
  name: string;
  short: string;
  tone: string;
  lead: string;
  goals: string[];
}

export const LEVELS: Level[] = [
  {
    slug: "tieu-hoc", apiLevels: ["tieu-hoc"], name: "Tiểu học", short: "Bay an toàn, học qua trò chơi", tone: "bg-teal",
    lead: "Học sinh làm quen với drone bằng những bài bay ngắn, an toàn trong lớp và trò chơi lập trình kéo thả.",
    goals: ["Hiểu drone bay được nhờ đâu", "Điều khiển cơ bản trong không gian an toàn", "Làm quen tư duy lập trình theo khối lệnh", "Làm việc nhóm và tuân thủ quy tắc an toàn"],
  },
  {
    slug: "thcs", apiLevels: ["thcs"], name: "THCS", short: "Lắp ráp, lập trình, cảm biến", tone: "bg-sky",
    lead: "Học sinh tự lắp ráp, lập trình đường bay và tìm hiểu cảm biến qua các dự án theo nhóm.",
    goals: ["Lắp ráp và kiểm tra một drone hoàn chỉnh", "Lập trình bay theo nhiệm vụ", "Đọc dữ liệu cảm biến cơ bản", "Thuyết trình kết quả dự án"],
  },
  {
    slug: "thpt", apiLevels: ["thpt", "quoc-te"], name: "THPT & quốc tế", short: "Dự án STEM, chương trình song ngữ", tone: "bg-[#0a6fb8]",
    lead: "Dự án STEM dài hạn, thi đấu và chương trình song ngữ cho lớp quốc tế.",
    goals: ["Thiết kế nhiệm vụ bay và đánh giá kết quả", "Lập trình nâng cao, xử lý dữ liệu bay", "Học liệu tiếng Anh và tiếng Việt", "Chuẩn bị cho các cuộc thi khoa học kỹ thuật"],
  },
  {
    slug: "dai-hoc", apiLevels: ["dai-hoc"], name: "Đại học & R&D", short: "Nền tảng nghiên cứu, dữ liệu bay", tone: "bg-ink",
    lead: "Nền tảng mở cho nghiên cứu: gắn cảm biến, thu dữ liệu bay và thử nghiệm thuật toán.",
    goals: ["Tích hợp cảm biến và payload", "Thu và phân tích nhật ký bay", "Thử nghiệm thuật toán điều khiển, AI", "Công bố kết quả, chia sẻ dữ liệu"],
  },
];

export function findLevel(slug: string): Level | undefined {
  return LEVELS.find((level) => level.slug === slug);
}

/** A real sequence, so numbered (spec §8.2). */
export const DEPLOYMENT_STEPS = [
  { title: "Tư vấn", text: "Tìm hiểu lớp học, mục tiêu và ngân sách của trường để chọn combo phù hợp." },
  { title: "Giao thiết bị", text: "Giao và kiểm tra thiết bị tại trường, sắp xếp khu vực bay an toàn." },
  { title: "Đào tạo giáo viên", text: "Hướng dẫn giáo viên vận hành thiết bị và dạy theo giáo trình." },
  { title: "Hỗ trợ cả năm học", text: "Hỗ trợ kỹ thuật, phụ tùng thay thế và cập nhật học liệu." },
];
