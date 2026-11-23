import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductTile } from "@/components/catalog/product-tile";
import { HeroCarousel, type HeroSlide } from "@/components/page/hero-carousel";
import { LinkTile } from "@/components/page/link-tile";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { DEPLOYMENT_STEPS, LEVELS } from "@/content/levels";
import { listArticles, listProducts } from "@/lib/api/server";
import { formatDate } from "@/lib/format";

// The homepage is also served (not redirected) on apex droneviet.vn for Zalo verification;
// the canonical keeps www as the indexed copy.
export const metadata: Metadata = {
  title: { absolute: "Drone Việt | Giải pháp drone trọn bộ cho lớp học" },
  description: "Combo drone cho lớp học, drone và linh kiện, đào tạo và chứng chỉ, bay mô phỏng trên trình duyệt.",
  alternates: { canonical: "https://www.droneviet.vn/" },
};

export default async function HomePage() {
  const [combos, drones, articles] = await Promise.all([
    listProducts("combo"),
    listProducts("drone", { featured: true }),
    listArticles({ limit: 2 }),
  ]);
  const flagship = combos.find((c) => c.slug === "combo-lop-hoc-quoc-te") ?? combos[0];
  const drone = drones[0];

  const slides: HeroSlide[] = [
    flagship
      ? {
          context: "Giải pháp trọn bộ cho một lớp học",
          title: flagship.name,
          subtitle: "Drone, giáo trình song ngữ và đào tạo giáo viên cho một lớp học.",
          image: flagship.coverImageUrl,
          actions: [
            { label: "Xem combo", href: `/cua-hang/combo/${flagship.slug}`, variant: "secondary" },
            { label: "Nhận báo giá", href: `/bao-gia?san-pham=${flagship.slug}` },
          ],
        }
      : {
          context: "Giải pháp trọn bộ cho một lớp học",
          title: "Drone cho lớp học của bạn",
          subtitle: "Thiết bị, giáo trình và đào tạo giáo viên trong một gói.",
          actions: [
            { label: "Xem combo", href: "/cua-hang?loai=combo", variant: "secondary" },
            { label: "Nhận tư vấn", href: "/bao-gia" },
          ],
        },
    {
      context: "Trải nghiệm ngay",
      title: "Bay mô phỏng trên trình duyệt",
      subtitle: "Tập cất cánh, hạ cánh và bay qua vòng. Không cần cài đặt.",
      actions: [{ label: "Bay thử ngay", href: "/bay-mo-phong", variant: "sun" }],
    },
    ...(drone
      ? [{
          context: "Drone cho học sinh",
          title: drone.name,
          subtitle: drone.summary,
          image: drone.coverImageUrl,
          actions: [
            { label: "Tìm hiểu", href: `/cua-hang/${drone.slug}`, variant: "secondary" as const },
            { label: "Mua ngay", href: `/cua-hang/${drone.slug}` },
          ],
        }]
      : []),
  ];

  return (
    <main>
      <HeroCarousel slides={slides} />

      <Container className="py-3">
        <div className="grid gap-3 md:grid-cols-2">
          {combos.map((combo) => (
            <ProductTile key={combo.slug} product={combo} />
          ))}
          {drone ? <ProductTile product={drone} context="Drone cho học sinh" /> : null}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <LinkTile href="/cua-hang?loai=linh-kien" context="Phụ tùng thay thế" title="Linh kiện & phụ kiện" text="Motor, pin, cánh quạt, mạch bay" />
          <LinkTile href="/dao-tao/chung-chi" context="Đào tạo" title="Lộ trình chứng chỉ" text="Từ lý thuyết đến bay thực hành" tone="line" />
          <LinkTile href="/cua-hang/so-sanh" context="Thông tin sản phẩm" title="So sánh các combo" text="Chọn combo hợp với trường bạn" />
        </div>
      </Container>

      <Container className="py-12">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="text-3xl font-light tracking-tight sm:text-4xl">Bay thử ngay trên trình duyệt</h2>
            <p className="mt-3 max-w-xl text-[#c9d7e6]">Tập cất cánh, giữ độ cao, hạ cánh vào ô và bay qua vòng. Mỗi bài có chấm điểm.</p>
          </div>
          <LinkButton href="/bay-mo-phong" variant="sun" size="lg">Bay thử</LinkButton>
        </div>
      </Container>

      {articles.length ? (
        <Section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-light tracking-tight">Bài viết R&amp;D mới</h2>
            <Link href="/r-d" className="inline-flex items-center gap-0.5 font-medium text-sky hover:underline underline-offset-4">
              Tất cả bài viết <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {articles.map((a) => (
              <Link key={a.slug} href={`/r-d/${a.slug}`} className="group rounded-2xl border border-line p-6 hover:border-sky">
                {a.publishedAt ? <p className="text-sm text-muted">{formatDate(a.publishedAt)}{a.readingMinutes ? `, ${a.readingMinutes} phút đọc` : ""}</p> : null}
                <h3 className="mt-2 text-xl font-semibold group-hover:text-sky">{a.title}</h3>
                {a.summary ? <p className="mt-2 text-muted">{a.summary}</p> : null}
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone="sky">
        <h2 className="text-center text-3xl font-light tracking-tight">Giải pháp theo cấp học</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((level) => (
            <Link key={level.slug} href={`/giao-duc/${level.slug}`} className={`group flex min-h-[180px] flex-col justify-between rounded-2xl p-6 ${level.tone} ${level.tone === "bg-teal" ? "text-ink" : "text-white"}`}>
              <span className="text-2xl font-semibold">{level.name}</span>
              <span>
                <span className="block opacity-90">{level.short}</span>
                <span className="mt-3 inline-flex items-center gap-0.5 font-semibold group-hover:underline underline-offset-4">
                  Tìm hiểu <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="text-3xl font-light tracking-tight">Triển khai tại trường trong 4 bước</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DEPLOYMENT_STEPS.map((step, i) => (
            <li key={step.title} className="border-t-2 border-ink pt-4">
              <span className="text-sm font-semibold text-muted">Bước {i + 1}</span>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <LinkButton href="/bao-gia" size="lg">Nhận tư vấn cho trường bạn</LinkButton>
        </div>
      </Section>
    </main>
  );
}
