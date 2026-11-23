import { ShoppingBag } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function EmptyCart() {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <ShoppingBag size={36} strokeWidth={1.5} className="mx-auto text-muted" aria-hidden="true" />
      <p className="mt-4 text-lg font-semibold">Giỏ hàng đang trống</p>
      <p className="mt-1 text-muted">Drone lẻ và linh kiện có thể mua online. Combo lớp học được báo giá riêng.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <LinkButton href="/cua-hang?loai=drone">Xem drone</LinkButton>
        <LinkButton href="/cua-hang?loai=linh-kien" variant="secondary">Xem linh kiện</LinkButton>
      </div>
    </div>
  );
}
