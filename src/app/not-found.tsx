import { LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center sm:py-32">
      <p className="text-sm font-semibold text-sky-ink">Lỗi 404</p>
      <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">Không tìm thấy trang</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-muted">Trang này đã được chuyển hoặc không còn tồn tại. Thử tìm kiếm hoặc quay về trang chủ.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/" size="lg">Về trang chủ</LinkButton>
        <LinkButton href="/cua-hang" size="lg" variant="secondary">Xem cửa hàng</LinkButton>
        <LinkButton href="/tim-kiem" size="lg" variant="ghost">Tìm kiếm</LinkButton>
      </div>
    </Container>
  );
}
