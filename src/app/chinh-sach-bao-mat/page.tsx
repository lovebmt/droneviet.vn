import type { Metadata } from "next";
import { LegalPage, LegalSection, ZaloContactLink } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description:
    "Drone Việt thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân như thế nào khi bạn đặt hàng, yêu cầu báo giá hoặc đăng nhập bằng email, Google, Zalo.",
  alternates: { canonical: "https://www.droneviet.vn/chinh-sach-bao-mat" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Chính sách bảo mật"
      effective="23/11/2026"
      intro="Drone Việt (website droneviet.vn, gồm www.droneviet.vn và máy chủ api.droneviet.vn) cung cấp thiết bị drone, giáo trình và dịch vụ cho nghiên cứu và giáo dục. Chính sách này giải thích chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân của bạn như thế nào khi bạn truy cập website, đặt hàng, yêu cầu báo giá hoặc đăng nhập bằng email, Google hoặc Zalo. Khi sử dụng website, bạn xác nhận đã đọc chính sách này."
    >
      <LegalSection heading="1. Dữ liệu chúng tôi thu thập">
        <ul>
          <li>
            <strong>Tài khoản:</strong> họ tên hiển thị, email và mật khẩu. Mật khẩu được lưu dưới dạng băm một
            chiều, dùng thuật toán mã hóa mật khẩu (bcrypt); chúng tôi không thể đọc mật khẩu gốc của bạn.
          </li>
          <li>
            <strong>Đăng nhập bằng Google:</strong> ID tài khoản Google, địa chỉ email và họ tên.
          </li>
          <li>
            <strong>Đăng nhập bằng Zalo:</strong> ID tài khoản Zalo và tên hiển thị. Zalo không cung cấp email,
            nên chúng tôi tạo một địa chỉ nội bộ dạng zalo_&lt;id&gt;@users.droneviet.vn chỉ để quản lý tài khoản.
          </li>
          <li>
            <strong>Đơn hàng:</strong> họ tên, số điện thoại, email (không bắt buộc), địa chỉ giao hàng, sản phẩm
            hoặc khóa học đã đặt, phương thức thanh toán, mã khuyến mại và trạng thái đơn.
          </li>
          <li>
            <strong>Yêu cầu báo giá:</strong> họ tên, tổ chức, số điện thoại, email, số lượng, ngân sách dự kiến và
            nội dung yêu cầu bạn nhập.
          </li>
          <li>
            <strong>Thanh toán:</strong> việc thanh toán trực tuyến do PayOS xử lý. Chúng tôi chỉ nhận mã giao dịch,
            số tiền và trạng thái thanh toán; chúng tôi không thu thập hay lưu số thẻ, thông tin đăng nhập ngân
            hàng của bạn.
          </li>
          <li>
            <strong>Dữ liệu kỹ thuật:</strong> nhật ký máy chủ (địa chỉ IP, thời gian, trang truy cập, loại trình
            duyệt) do nhà cung cấp hạ tầng ghi nhận để vận hành và bảo mật hệ thống.
          </li>
          <li>
            <strong>Cookie:</strong> website không sử dụng cookie quảng cáo và không cài công cụ phân tích hay theo
            dõi hành vi của bên thứ ba. Giỏ hàng chỉ nằm trong bộ nhớ trình duyệt của bạn trong phiên truy cập.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. Mục đích sử dụng">
        <ul>
          <li>Tạo tài khoản, xác thực và bảo vệ tài khoản của bạn.</li>
          <li>Xử lý đơn hàng: giữ chỗ tồn kho, thanh toán, đóng gói, giao hàng, bảo hành và hỗ trợ sau bán.</li>
          <li>Tư vấn, gửi báo giá và liên hệ với bạn về đơn hàng hoặc yêu cầu của bạn.</li>
          <li>Phòng chống gian lận, bảo đảm an toàn hệ thống.</li>
          <li>Tuân thủ nghĩa vụ pháp luật, như kế toán và thuế.</li>
        </ul>
        <p>Chúng tôi không dùng dữ liệu của bạn để quảng cáo cho bên thứ ba hay lập hồ sơ hành vi.</p>
      </LegalSection>

      <LegalSection heading="3. Dữ liệu người dùng từ Google và Zalo">
        <p>
          Khi bạn chọn “Tiếp tục với Google”, chúng tôi chỉ yêu cầu các quyền (scope) openid, email và profile để
          nhận ID tài khoản Google, địa chỉ email và họ tên của bạn. Chúng tôi dùng thông tin này duy nhất để tạo
          hoặc đăng nhập vào tài khoản Drone Việt của bạn. Chúng tôi không truy cập Gmail, Drive, Danh bạ, Lịch hay
          bất kỳ dữ liệu Google nào khác; không dùng dữ liệu này cho quảng cáo; không bán hoặc chuyển cho bên thứ
          ba; và không cho người khác đọc, trừ khi cần để hỗ trợ bạn, bảo mật hệ thống hoặc tuân thủ pháp luật.
        </p>
        <p>
          Việc Drone Việt sử dụng và chuyển giao thông tin nhận được từ các API của Google tuân thủ{" "}
          <a
            className="text-[#006D66] underline underline-offset-4"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , bao gồm các yêu cầu Limited Use.
        </p>
        <p>
          Bạn có thể thu hồi quyền truy cập của Drone Việt bất cứ lúc nào tại{" "}
          <a
            className="text-[#006D66] underline underline-offset-4"
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://myaccount.google.com/permissions
          </a>
          .
        </p>
        <p>
          Với Zalo, chúng tôi chỉ nhận ID và tên hiển thị của bạn, dùng cho cùng mục đích đăng nhập. Bạn có thể
          gỡ quyền của ứng dụng Drone Việt trong phần quản lý ứng dụng đã liên kết của tài khoản Zalo, hoặc liên hệ
          để chúng tôi xóa liên kết đó.
        </p>
      </LegalSection>

      <LegalSection heading="4. Chia sẻ dữ liệu">
        <p>
          Chúng tôi không bán dữ liệu cá nhân của bạn. Dữ liệu chỉ được chia sẻ với các bên sau, trong phạm vi cần
          thiết để cung cấp dịch vụ:
        </p>
        <ul>
          <li>
            <strong>PayOS:</strong> cổng thanh toán xử lý thanh toán trực tuyến (mã đơn, số tiền, mô tả đơn).
          </li>
          <li>
            <strong>Giao hàng:</strong> tên, số điện thoại và địa chỉ giao hàng được chuyển cho các đơn vị vận
            chuyển để giao đơn của bạn.
          </li>
          <li>
            <strong>Hạ tầng kỹ thuật:</strong> Vercel (lưu trữ website và API), Neon (cơ sở dữ liệu PostgreSQL) và
            Cloudflare (DNS). Máy chủ của các nhà cung cấp này có thể đặt ngoài lãnh thổ Việt Nam, trong đó có Hoa
            Kỳ.
          </li>
          <li>
            <strong>Google và Zalo:</strong> chỉ khi bạn chủ động chọn đăng nhập bằng các dịch vụ này.
          </li>
          <li>
            <strong>Cơ quan nhà nước có thẩm quyền:</strong> khi có yêu cầu hợp pháp bằng văn bản.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Lưu trữ, thời hạn và bảo mật">
        <ul>
          <li>Dữ liệu truyền qua website và API được mã hóa bằng HTTPS.</li>
          <li>Quyền truy cập khu vực quản trị được phân theo vai trò và yêu cầu đăng nhập.</li>
          <li>Dữ liệu tài khoản được giữ đến khi bạn yêu cầu xóa tài khoản.</li>
          <li>
            Dữ liệu đơn hàng và thanh toán được giữ theo thời hạn mà pháp luật về kế toán và thuế yêu cầu. Dữ
            liệu báo giá được giữ trong thời gian cần thiết để tư vấn và theo dõi.
          </li>
        </ul>
        <p>
          Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng đến dữ liệu cá nhân, chúng tôi sẽ xử lý
          và thông báo theo quy định của pháp luật.
        </p>
      </LegalSection>

      <LegalSection heading="6. Quyền của bạn">
        <p>
          Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, bạn có quyền được biết, đồng ý hoặc không đồng
          ý, truy cập, chỉnh sửa, rút lại sự đồng ý, yêu cầu xóa, hạn chế xử lý, phản đối việc xử lý, khiếu nại và
          yêu cầu bồi thường thiệt hại liên quan đến dữ liệu cá nhân của mình.
        </p>
        <p>
          Để thực hiện các quyền này, hãy liên hệ chúng tôi qua <ZaloContactLink />. Chúng tôi sẽ xác minh danh
          tính và phản hồi trong thời hạn pháp luật quy định.
        </p>
      </LegalSection>

      <LegalSection heading="7. Dữ liệu của trẻ em">
        <p>
          Dịch vụ của chúng tôi phục vụ giáo dục từ cấp 1 đến đại học, nhưng việc tạo tài khoản và đặt hàng dành
          cho phụ huynh, giáo viên, nhà trường hoặc người từ đủ 16 tuổi. Người dưới 16 tuổi cần có sự đồng ý của
          cha mẹ hoặc người giám hộ. Nếu phát hiện đã thu thập dữ liệu của trẻ em mà không có sự đồng ý, chúng tôi
          sẽ xóa dữ liệu đó.
        </p>
      </LegalSection>

      <LegalSection heading="8. Thay đổi chính sách">
        <p>
          Chúng tôi có thể cập nhật chính sách này khi dịch vụ hoặc quy định pháp luật thay đổi. Phiên bản mới sẽ
          được đăng tại trang này kèm ngày có hiệu lực; những thay đổi quan trọng sẽ được thông báo trên website.
        </p>
      </LegalSection>

      <LegalSection heading="9. Liên hệ">
        <p>
          Mọi câu hỏi về chính sách bảo mật hoặc dữ liệu cá nhân, vui lòng liên hệ Drone Việt qua <ZaloContactLink />{" "}
          hoặc gửi yêu cầu tại trang báo giá của website https://www.droneviet.vn.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
