import Link from "next/link";
import type { ReactNode } from "react";

export const ZALO_CONTACT_URL = "https://zalo.me/0384070636";

export function ZaloContactLink() {
  return (
    <a
      href={ZALO_CONTACT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-[#006D66] underline underline-offset-4"
    >
      Zalo 0384070636
    </a>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <div className="mt-3 grid gap-3 leading-7 text-slate-700 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1.5">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({
  title,
  effective,
  intro,
  children,
}: {
  title: string;
  effective: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white px-5 py-10 text-[#10232A] sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-medium text-[#006D66]">Drone Việt</p>
        <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-slate-500">Có hiệu lực từ {effective}</p>
        <p className="mt-6 leading-7 text-slate-700">{intro}</p>
        {children}
        <p className="mt-12 border-t border-black/10 pt-6 text-sm text-slate-500">
          <Link href="/" className="text-[#006D66] underline underline-offset-4">
            Về trang chủ Drone Việt
          </Link>
        </p>
      </article>
    </main>
  );
}
