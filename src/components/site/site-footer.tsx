import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PublicSettings } from "@/lib/api/types";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";

const COLUMNS: Array<{ title: string; links: Array<[string, string]> }> = [
  { title: "Giáo dục", links: [["Tiểu học", "/giao-duc/tieu-hoc"], ["THCS", "/giao-duc/thcs"], ["THPT & quốc tế", "/giao-duc/thpt"], ["Đại học & R&D", "/giao-duc/dai-hoc"]] },
  { title: "Cửa hàng", links: [["Combo lớp học", "/cua-hang?loai=combo"], ["Drone", "/cua-hang?loai=drone"], ["Linh kiện & phụ kiện", "/cua-hang?loai=linh-kien"], ["So sánh combo", "/cua-hang/so-sanh"]] },
  { title: "Đào tạo", links: [["Chứng chỉ, giấy phép bay", "/dao-tao/chung-chi"], ["Cấp phép bay", "/dao-tao/cap-phep"], ["Bay mô phỏng", "/bay-mo-phong"], ["Bài viết R&D", "/r-d"]] },
  { title: "Hỗ trợ", links: [["Hỗ trợ & bảo hành", "/ho-tro"], ["Theo dõi đơn hàng", "/tai-khoan/don-hang"], ["Bay an toàn & cấp phép", "/bay-an-toan"], ["Nhận báo giá", "/bao-gia"]] },
];

const TRIO: Array<[string, string, string]> = [
  ["Liên hệ & báo giá", "Tư vấn combo cho trường bạn", "/bao-gia"],
  ["Hỗ trợ & bảo hành", "Hướng dẫn, đổi trả, sửa chữa", "/ho-tro"],
  ["Bay an toàn & cấp phép", "Quy định và thủ tục bay", "/bay-an-toan"],
];

function ContactRow({ label, value, href }: { label: string; value: string | null; href?: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-400">{label}:</dt>
      <dd>{value ? href ? <a href={href} className="text-white underline-offset-4 hover:underline">{value}</a> : value : "Đang cập nhật"}</dd>
    </div>
  );
}

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const { contact } = settings;
  return (
    <footer className="mt-auto">
      <div className="border-t border-line bg-sky-50">
        <Container className="grid gap-px sm:grid-cols-3">
          {TRIO.map(([title, text, href]) => (
            <Link key={href} href={href} className="group flex items-center justify-between gap-4 py-6 sm:px-6 sm:first:pl-0">
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="text-sm text-muted">{text}</span>
              </span>
              <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </Container>
      </div>
      <div className="bg-ink text-slate-300">
        <Container className="grid gap-10 py-14 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo tone="white" />
            <p className="mt-4 max-w-sm text-sm leading-6">Giải pháp drone trọn bộ cho giáo dục: thiết bị, giáo trình, đào tạo giáo viên và hỗ trợ suốt năm học.</p>
            <dl className="mt-6 grid gap-1.5 text-sm">
              {contact.companyName ? <div className="font-semibold text-white">{contact.companyName}</div> : null}
              <ContactRow label="Zalo" value={contact.zalo ? `Zalo ${contact.zalo}` : null} href={contact.zalo ? `https://zalo.me/${contact.zalo}` : undefined} />
              <ContactRow label="Điện thoại" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
              <ContactRow label="Email" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
              <ContactRow label="Địa chỉ" value={contact.address} />
            </dl>
          </div>
          <nav aria-label="Liên kết cuối trang" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-semibold text-white">{column.title}</p>
                <ul className="mt-3 grid gap-2 text-sm">
                  {column.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="hover:text-white">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </Container>
        <Container className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Drone Việt</span>
          <nav aria-label="Pháp lý" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/chinh-sach-bao-mat" className="hover:text-white">Chính sách bảo mật</Link>
            <Link href="/dieu-khoan-su-dung" className="hover:text-white">Điều khoản sử dụng</Link>
            <Link href="/en" lang="en" hrefLang="en" className="hover:text-white">English</Link>
          </nav>
        </Container>
      </div>
    </footer>
  );
}
