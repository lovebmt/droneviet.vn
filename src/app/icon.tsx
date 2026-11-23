import { ImageResponse } from "next/og";
import { DroneMark } from "@/lib/seo/brand-image";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** App icon (also the Organization logo at /icon.png). */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B6FE0", borderRadius: 112 }}>
        <DroneMark size={340} color="#FFFFFF" />
      </div>
    ),
    size,
  );
}
