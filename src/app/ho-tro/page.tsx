import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { FaqList } from "@/components/catalog/faq-list";
import { OrderLookup } from "@/components/forms/order-lookup";
import { PageHeader } from "@/components/page/page-header";
import { Section } from "@/components/ui/section";
import { SUPPORT_FAQ } from "@/content/support";
import { getSettings } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Hỗ trợ & bảo hành",
  description: "Liên hệ Drone Việt, tra cứu đơn hàng và câu hỏi thường gặp về giao hàng, đổi trả, bảo hành.",
  alternates: { canonical: "/ho-tro" },
};

export default async function SupportPage() {
  const { contact } = await getSettings();
  const rows = [
    { Icon: MessageCircle, label: "Zalo", value: contact.zalo, href: contact.zalo ? `https://zalo.me/${contact.zalo}` : null },
    { Icon: Phone, label: "Điện thoại", value: contact.phone, href: contact.phone ? `tel:${contact.phone.replace(/\s/g, "")}` : null },
    { Icon: Mail, label: "Email", value: contact.email, href: contact.email ? `mailto:${contact.email}` : null },
    { Icon: MapPin, label: "Địa chỉ", value: contact.address, href: null },
  ];

  return (
    <>
      <PageHeader
        title="Hỗ trợ & bảo hành"
        lead="Liên hệ Drone Việt, tra cứu đơn hàng hoặc tìm câu trả lời nhanh."
        crumbs={[{ label: "Trang chủ", href: "/" }, { label: "Hỗ trợ" }]}
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[22rem_1fr]">
          <div>
            <h2 className="text-2xl font-semibold">Liên hệ</h2>
            <ul className="mt-6 space-y-5">
              {rows.map(({ Icon, label, value, href }) => (
                <li key={label} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-50 text-sky-ink"><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
                  <div>
                    <p className="text-sm text-muted">{label}</p>
                    <p className="font-semibold">
                      {value ? (href ? <a href={href} className="hover:text-sky-ink" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{value}</a> : value) : "Đang cập nhật"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/bay-an-toan" className="mt-8 flex items-center gap-3 rounded-2xl border border-line p-4 hover:border-sky">
              <ShieldCheck size={22} strokeWidth={1.75} className="text-teal-ink" aria-hidden="true" />
              <span className="font-semibold">Bay an toàn & cấp phép</span>
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Câu hỏi thường gặp</h2>
            <div className="mt-6"><FaqList items={SUPPORT_FAQ} /></div>
          </div>
        </div>
      </Section>
      <Section tone="sky" id="tra-cuu">
        <h2 className="text-2xl font-semibold">Tra cứu đơn hàng</h2>
        <p className="mt-2 text-muted">
          Đã có tài khoản? <Link href="/tai-khoan/don-hang" className="font-semibold text-sky-ink underline underline-offset-4">Xem đơn hàng của tôi</Link>. Nếu đặt hàng không đăng nhập, nhập mã đơn và số điện thoại.
        </p>
        <div className="mt-6 max-w-3xl"><OrderLookup /></div>
      </Section>
    </>
  );
}
