import { ImageResponse } from "next/og";
import { brandFonts, DroneMark } from "@/lib/seo/brand-image";

export const alt = "Drone Việt: giải pháp drone cho giáo dục";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share image for every page that has no image of its own. */
export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #EAF4FF 0%, #FFF6DC 100%)", fontFamily: "Be Vietnam Pro", color: "#0F2742" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <DroneMark size={72} color="#0B6FE0" />
          <span style={{ fontSize: 44, fontWeight: 600 }}>Drone Việt</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 66, fontWeight: 600, lineHeight: 1.1 }}>Giải pháp drone cho giáo dục</span>
          <span style={{ fontSize: 29, color: "#4A6078" }}>Combo lớp học · Workshop trải nghiệm · Giấy phép bay · Bay mô phỏng</span>
        </div>
        <span style={{ display: "flex", fontSize: 28, color: "#0B6FE0", fontWeight: 600 }}>www.droneviet.vn</span>
      </div>
    ),
    { ...size, fonts: await brandFonts() },
  );
}
