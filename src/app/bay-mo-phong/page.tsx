import type { Metadata } from "next";
import { Gamepad2, Keyboard, Smartphone } from "lucide-react";
import { SimLauncher } from "@/components/sim/sim-launcher";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Bay mô phỏng",
  description: "Tập lái drone ngay trên trình duyệt: cất cánh, hạ cánh, bay qua vòng và bay số 8. Dùng bàn phím, tay cầm hoặc màn hình cảm ứng.",
  alternates: { canonical: "/bay-mo-phong" },
};

const CONTROLS = [
  { Icon: Keyboard, title: "Bàn phím", rows: ["W / S: bay lên, hạ xuống (thả phím để giữ độ cao)", "A / D: xoay trái, phải", "Mũi tên: tiến, lùi, nghiêng trái, phải", "Shift: bay nhanh, V: đổi góc camera", "M: đổi chế độ Angle / Acro, P: tạm dừng"] },
  { Icon: Gamepad2, title: "Tay cầm hoặc bộ điều khiển RC", rows: ["Cắm qua USB hoặc Bluetooth", "Cần trái: ga và xoay, cần phải: tiến lùi và nghiêng", "Hiệu chỉnh trục trong màn hình bay"] },
  { Icon: Smartphone, title: "Điện thoại, máy tính bảng", rows: ["Cần ảo trái: ga và xoay", "Cần ảo phải: tiến lùi và nghiêng", "Nên xoay ngang màn hình"] },
];

export default function SimulatorPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-[#fff6dc] to-white">
        <Container className="py-12 sm:py-16">
          <p className="inline-flex rounded-full bg-sun px-3 py-1 text-sm font-semibold text-ink">Miễn phí, không cần cài đặt</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-light tracking-tight sm:text-5xl">Bay mô phỏng</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">Tập điều khiển drone trước khi bay thật. Chế độ Angle tự cân bằng cho người mới, chế độ Acro cho người muốn thử thách. Kết quả được lưu trên máy và trong tài khoản khi bạn đăng nhập.</p>
        </Container>
      </section>
      <Section>
        <h2 className="text-3xl font-light tracking-tight">Chọn bài tập</h2>
        <div className="mt-8"><SimLauncher /></div>
      </Section>
      <Section tone="sky">
        <h2 className="text-3xl font-light tracking-tight">Cách điều khiển</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {CONTROLS.map(({ Icon, title, rows }) => (
            <li key={title} className="rounded-2xl bg-white p-6">
              <Icon size={24} strokeWidth={1.75} className="text-sky-ink" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted">{rows.map((r) => <li key={r}>{r}</li>)}</ul>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">Trình mô phỏng do Drone Việt tự xây dựng cho mục đích học tập. Vật lý được đơn giản hóa, cảm giác bay thật có thể khác.</p>
      </Section>
    </>
  );
}
