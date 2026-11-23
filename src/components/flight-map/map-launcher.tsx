"use client";

import { type ComponentType, useEffect, useState } from "react";
import { loadFlightMap } from "./load-flight-map";

/** Loads the Leaflet map after the page has rendered. */
export function MapLauncher() {
  const [Map, setMap] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadFlightMap()
      .then((mod) => active && setMap(() => mod.FlightMap))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  if (Map) return <Map />;
  return (
    <div className="grid h-[28rem] place-items-center rounded-2xl bg-sky-50 text-muted">
      {failed ? "Không tải được bản đồ. Kiểm tra kết nối mạng rồi tải lại trang." : "Đang tải bản đồ…"}
    </div>
  );
}
