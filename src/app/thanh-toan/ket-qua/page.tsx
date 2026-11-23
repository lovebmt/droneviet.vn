import Link from "next/link";

// PayOS appends ?code=&id=&cancel=&status=&orderCode= to the return and cancel URLs.
interface PaymentResultPageProps {
  searchParams?: Promise<{
    cancel?: string;
    orderCode?: string;
    status?: string;
  }>;
}

const outcomes = {
  paid: {
    title: "Thanh toán thành công",
    body: "Drone Việt đã nhận thanh toán. Chúng tôi sẽ xác nhận và chuẩn bị đơn hàng của bạn.",
    action: { href: "/theo-doi-don", label: "Theo dõi đơn hàng" },
  },
  cancelled: {
    title: "Đã hủy thanh toán",
    body: "Giao dịch chưa được thực hiện. Sản phẩm vẫn được giữ trong thời gian ngắn, bạn có thể thanh toán lại.",
    action: { href: "/gio-hang", label: "Quay lại giỏ hàng" },
  },
  pending: {
    title: "Đang chờ xác nhận thanh toán",
    body: "PayOS chưa báo kết quả cuối cùng. Vui lòng kiểm tra lại trạng thái đơn sau ít phút.",
    action: { href: "/theo-doi-don", label: "Theo dõi đơn hàng" },
  },
} as const;

export default async function PaymentResultPage({ searchParams }: PaymentResultPageProps) {
  const params = (await searchParams) ?? {};
  const status = params.status?.toUpperCase();
  const outcome =
    status === "PAID"
      ? outcomes.paid
      : params.cancel === "true" || status === "CANCELLED"
        ? outcomes.cancelled
        : outcomes.pending;

  return (
    <main className="min-h-screen bg-white px-5 py-16 text-[#10232A] sm:px-8">
      <section className="mx-auto max-w-xl">
        <p className="text-xs font-medium text-[#006D66]">Drone Viet Store</p>
        <h1 className="mt-3 text-4xl font-semibold">{outcome.title}</h1>
        <p className="mt-5 leading-7 text-slate-600">{outcome.body}</p>
        {params.orderCode ? (
          <p className="mt-4 text-sm text-slate-500">Mã giao dịch PayOS: {params.orderCode}</p>
        ) : null}
        <Link
          className="mt-8 inline-flex min-h-11 items-center bg-[#10232A] px-5 text-sm font-medium text-white"
          href={outcome.action.href}
        >
          {outcome.action.label}
        </Link>
      </section>
    </main>
  );
}
