import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, ZaloContactLink } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description:
    "Điều khoản sử dụng website và cửa hàng Drone Việt: tài khoản, đặt hàng, thanh toán, giao hàng, sử dụng drone an toàn và hợp pháp.",
  alternates: { canonical: "https://www.droneviet.vn/dieu-khoan-su-dung" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản sử dụng"
      effective="23/11/2026"
      intro="Khi truy cập website droneviet.vn, tạo tài khoản, đặt hàng hoặc gửi yêu cầu báo giá, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng website."
    >
      <LegalSection heading="1. Tài khoản">
        <ul>
          <li>Bạn cung cấp thông tin chính xác và chịu trách nhiệm bảo mật mật khẩu cũng như hoạt động trên tài khoản của mình.</li>
          <li>Bạn có thể đăng ký bằng email hoặc đăng nhập bằng Google, Zalo.</li>
          <li>Chúng tôi có thể tạm khóa tài khoản có dấu hiệu gian lận hoặc vi phạm điều khoản.</li>
          <li>
            Cách chúng tôi xử lý dữ liệu của bạn được mô tả trong{" "}
            <Link href="/chinh-sach-bao-mat" className="text-[#006D66] underline underline-offset-4">
              Chính sách bảo mật
            </Link>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. Sản phẩm, giá và đặt hàng">
        <ul>
          <li>Giá niêm yết bằng đồng Việt Nam (VND). Thông tin, giá và tình trạng hàng có thể thay đổi mà không báo trước.</li>
          <li>Sản phẩm ghi “Báo giá” hoặc “Đặt trước” cần trao đổi thêm với chúng tôi; yêu cầu báo giá không phải là đơn hàng.</li>
          <li>
            Khi bạn đặt hàng, chúng tôi giữ chỗ tồn kho trong 30 phút để bạn hoàn tất thanh toán. Quá thời hạn
            này, đơn chưa thanh toán chuyển sang trạng thái thanh toán thất bại và hàng được trả về kho.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Thanh toán">
        <ul>
          <li>Bạn có thể thanh toán qua PayOS (QR hoặc chuyển khoản ngân hàng), chuyển khoản trực tiếp hoặc thanh toán khi nhận hàng, tùy lựa chọn hiển thị khi thanh toán.</li>
          <li>Đơn được ghi nhận đã thanh toán khi PayOS xác nhận giao dịch.</li>
          <li>
            Nếu thanh toán đến sau khi hết thời hạn giữ chỗ và hàng không còn, chúng tôi sẽ liên hệ và hoàn lại
            tiền cho bạn.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Giao hàng, bảo hành và đổi trả">
        <p>
          Thời gian và phí giao hàng được thông báo khi xác nhận đơn. Điều kiện bảo hành, đổi trả áp dụng theo
          thông tin của từng sản phẩm và quy định pháp luật về bảo vệ quyền lợi người tiêu dùng. Vui lòng kiểm tra
          hàng khi nhận và liên hệ ngay nếu có sai khác hoặc hư hỏng.
        </p>
      </LegalSection>

      <LegalSection heading="5. Sử dụng drone an toàn và hợp pháp">
        <p>
          Thiết bị, giáo trình và tài liệu của Drone Việt phục vụ nghiên cứu và giáo dục. Khi sử dụng drone, bạn
          phải tuân thủ quy định pháp luật Việt Nam về quản lý hoạt động bay, bao gồm xin cấp phép bay khi pháp
          luật yêu cầu, và tự chịu trách nhiệm về an toàn của người, tài sản xung quanh. Chúng tôi không chịu
          trách nhiệm đối với việc sử dụng thiết bị trái pháp luật hoặc không đúng hướng dẫn.
        </p>
      </LegalSection>

      <LegalSection heading="6. Sở hữu trí tuệ">
        <p>
          Nội dung, thương hiệu, giáo trình và giao diện của website thuộc Drone Việt hoặc bên cấp phép. Bạn không
          được sao chép, phân phối lại hoặc khai thác thương mại nếu chưa được chúng tôi đồng ý bằng văn bản. Các
          hình ảnh của bên thứ ba (ví dụ ảnh drone của Igor Savin, CC BY-SA 3.0) giữ nguyên giấy phép của tác giả.
        </p>
      </LegalSection>

      <LegalSection heading="7. Giới hạn trách nhiệm">
        <p>
          Chúng tôi nỗ lực duy trì website hoạt động ổn định nhưng không bảo đảm website không bao giờ gián đoạn
          hay không có lỗi. Trong phạm vi pháp luật cho phép, Drone Việt không chịu trách nhiệm đối với thiệt hại
          gián tiếp phát sinh từ việc sử dụng website; điều khoản này không loại trừ trách nhiệm mà pháp luật
          không cho phép loại trừ.
        </p>
      </LegalSection>

      <LegalSection heading="8. Thay đổi và luật áp dụng">
        <p>
          Chúng tôi có thể cập nhật điều khoản này và đăng phiên bản mới tại trang này. Điều khoản được điều chỉnh
          bởi pháp luật Việt Nam; tranh chấp được ưu tiên giải quyết bằng thương lượng, nếu không thành sẽ đưa ra
          cơ quan có thẩm quyền tại Việt Nam.
        </p>
      </LegalSection>

      <LegalSection heading="9. Liên hệ">
        <p>
          Mọi thắc mắc về điều khoản, vui lòng liên hệ Drone Việt qua <ZaloContactLink />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
