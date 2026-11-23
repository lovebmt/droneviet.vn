import type { Metadata } from "next";
import { CheckCircle2, CircleAlert, Clock } from "lucide-react";
import { ClearCart } from "@/components/checkout/clear-cart";
import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Kết quả thanh toán", robots: { index: false } };

// PayOS appends ?code=&id=&cancel=&status=&orderCode= to the return and cancel URLs.
type Search = { cancel?: string; orderCode?: string; status?: string };

const OUTCOMES = {
  paid: {
    Icon: CheckCircle2,
    tone: "text-teal-ink",
    title: "Thanh toán thành công",
    body: "Drone Việt đã nhận thanh toán và sẽ chuẩn bị đơn hàng của bạn.",
    action: { href: "/tai-khoan/don-hang", label: "Xem đơn hàng của tôi" },
  },
  cancelled: {
    Icon: CircleAlert,
    tone: "text-muted",
    title: "Đã hủy thanh toán",
    body: "Giao dịch chưa được thực hiện. Sản phẩm vẫn trong giỏ hàng, bạn có thể đặt lại.",
    action: { href: "/gio-hang", label: "Quay lại giỏ hàng" },
  },
  pending: {
    Icon: Clock,
    tone: "text-sky-ink",
    title: "Đang chờ xác nhận thanh toán",
    body: "PayOS chưa báo kết quả cuối cùng. Kiểm tra lại trạng thái đơn sau ít phút.",
    action: { href: "/tai-khoan/don-hang", label: "Xem đơn hàng của tôi" },
  },
} as const;

export default async function PaymentResultPage({ searchParams }: { searchParams?: Promise<Search> }) {
  const params = (await searchParams) ?? {};
  const status = params.status?.toUpperCase();
  const key = status === "PAID" ? "paid" : params.cancel === "true" || status === "CANCELLED" ? "cancelled" : "pending";
  const outcome = OUTCOMES[key];

  return (
    <Container className="py-16 sm:py-24">
      {key === "paid" ? <ClearCart /> : null}
      <section className="mx-auto max-w-xl text-center">
        <outcome.Icon size={44} strokeWidth={1.5} className={`mx-auto ${outcome.tone}`} aria-hidden="true" />
        <h1 className="mt-4 text-4xl font-light tracking-tight">{outcome.title}</h1>
        <p className="mt-4 text-lg text-muted">{outcome.body}</p>
        {params.orderCode ? <p className="mt-3 text-sm text-muted">Mã giao dịch PayOS: {params.orderCode}</p> : null}
        <LinkButton href={outcome.action.href} size="lg" className="mt-8">{outcome.action.label}</LinkButton>
      </section>
    </Container>
  );
}
