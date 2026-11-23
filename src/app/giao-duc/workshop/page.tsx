import type { Metadata } from "next";
import { Check, MessageCircle } from "lucide-react";
import { Markdown } from "@/components/content/markdown";
import { EnrollForm } from "@/components/forms/enroll-form";
import { PageHeader } from "@/components/page/page-header";
import { LinkButton } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { WORKSHOP_INTRO } from "@/content/workshop";
import { getCourse, getSettings, listCourses } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Workshop trải nghiệm drone",
  description: "Buổi trải nghiệm drone cho học sinh: bay thử an toàn, lắp ráp, lập trình nhiệm vụ bay. Tổ chức tại trường hoặc tại Drone Việt.",
  alternates: { canonical: "/giao-duc/workshop" },
};

/** Workshops are courses with level "workshop": sessions, seats and the enroll form come from the course API. */
export default async function WorkshopPage() {
  const [workshops, settings] = await Promise.all([listCourses({ level: "workshop" }), getSettings()]);
  const workshop = workshops[0] ? await getCourse(workshops[0].slug) : null;
  const generalZalo = settings.contact.zalo ? `https://zalo.me/${settings.contact.zalo}` : null;
  const groupZalo = workshop?.zaloGroupUrl ?? null;

  return (
    <>
      <PageHeader
        title={WORKSHOP_INTRO.title}
        lead={WORKSHOP_INTRO.lead}
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Giáo dục" }, { label: "Workshop" }]}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href="#dang-ky" size="lg">Đăng ký workshop</LinkButton>
          {groupZalo ? (
            <LinkButton href={groupZalo} size="lg" variant="secondary" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /> Tham gia nhóm Zalo
            </LinkButton>
          ) : null}
        </div>
      </PageHeader>

      <Section id="dang-ky">
        <div className="grid gap-10 lg:grid-cols-[1fr_32rem]">
          <div>
            <h2 className="text-3xl font-light tracking-tight">Lịch và đăng ký</h2>
            <p className="mt-3 text-muted">Workshop diễn ra lúc 9:00 sáng thứ Bảy và Chủ nhật. Chọn ngày và để lại thông tin, Drone Việt gọi lại để xác nhận địa điểm và số người.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {groupZalo ? (
                <LinkButton href={groupZalo} variant="secondary" target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /> Tham gia nhóm Zalo workshop
                </LinkButton>
              ) : null}
              {generalZalo ? (
                <LinkButton href={generalZalo} variant="secondary" target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" /> Nhắn Zalo Drone Việt
                </LinkButton>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6">
            {workshop?.sessions.length ? (
              <EnrollForm course={workshop} group />
            ) : (
              <p className="text-muted">Lịch workshop đang cập nhật. Nhắn Zalo để đặt lịch riêng cho lớp hoặc trường của bạn.</p>
            )}
          </div>
        </div>
      </Section>

      <Section tone="sky">
        <h2 className="text-3xl font-light tracking-tight">Một buổi workshop gồm những gì</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {WORKSHOP_INTRO.points.map((p) => (
            <li key={p.title} className="rounded-2xl bg-white p-6">
              <Check size={22} strokeWidth={2} className="text-teal-ink" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKSHOP_INTRO.facts.map((f) => (
            <div key={f.label} className="rounded-2xl bg-white p-5">
              <dt className="text-sm text-muted">{f.label}</dt>
              <dd className="mt-1 font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>
        {workshop?.descriptionMarkdown ? <div className="mt-10 max-w-3xl"><Markdown source={workshop.descriptionMarkdown} /></div> : null}
      </Section>
    </>
  );
}
