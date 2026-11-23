"use client";

import { Crosshair, ExternalLink, Search } from "lucide-react";
import { type FormEvent, useState } from "react";
import { FormError, Input } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { type ZoneCollection, zoneAt } from "./zones";

export const OFFICIAL_MAP = "https://cambay.mod.gov.vn";

export interface PickedPoint {
  lat: number;
  lon: number;
  label?: string;
}

type Place = { lat: string; lon: string; display_name: string };

const STATUS = {
  cam: { title: "Trong khu vực cấm bay", tone: "bg-red-50 text-red-900 border-red-200" },
  "han-che": { title: "Trong khu vực hạn chế bay, cần xin phép bay", tone: "bg-amber-50 text-amber-900 border-amber-200" },
  unknown: { title: "Không nằm trong vùng đã vẽ trên bản đồ này", tone: "bg-sky-50 text-ink border-line" },
} as const;

/** Search (OpenStreetMap Nominatim, Vietnam only), "my location", and what the drawn zones say about the picked point. */
export function MapPanel({ zones, picked, onPick }: { zones: ZoneCollection | null; picked: PickedPoint | null; onPick(point: PickedPoint): void }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      const query = new URLSearchParams({ q, format: "jsonv2", countrycodes: "vn", limit: "5", "accept-language": "vi" });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`);
      if (!response.ok) throw new Error(String(response.status));
      const found = (await response.json()) as Place[];
      setPlaces(found);
      if (!found.length) setError("Không tìm được địa điểm này. Thử tên khác hoặc bấm trực tiếp lên bản đồ.");
    } catch {
      setPlaces([]);
      setError("Không tìm được địa điểm lúc này. Thử lại sau hoặc bấm trực tiếp lên bản đồ.");
    } finally {
      setSearching(false);
    }
  }

  function locate() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí. Bấm trực tiếp lên bản đồ.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onPick({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Vị trí của bạn" }),
      () => setError("Chưa lấy được vị trí. Kiểm tra quyền truy cập vị trí hoặc bấm trực tiếp lên bản đồ."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const result = picked && zones ? zoneAt([picked.lon, picked.lat], zones) : null;
  const status = result ? STATUS[result.status] : null;

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2" role="search">
        <label className="sr-only" htmlFor="map-search">Tìm địa điểm</label>
        <Input id="map-search" name="q" placeholder="Tên trường, xã, phường…" className="mt-0 flex-1" autoComplete="off" />
        <Button type="submit" disabled={searching}>
          <Search size={18} strokeWidth={1.75} aria-hidden="true" /> Tìm
        </Button>
      </form>
      <Button type="button" variant="secondary" onClick={locate}>
        <Crosshair size={18} strokeWidth={1.75} aria-hidden="true" /> Vị trí của tôi
      </Button>
      <FormError message={error} />
      {places.length ? (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {places.map((p) => (
            <li key={`${p.lat},${p.lon}`}>
              <button
                type="button"
                className="w-full p-3 text-left text-sm hover:bg-sky-50"
                onClick={() => {
                  setPlaces([]);
                  onPick({ lat: Number(p.lat), lon: Number(p.lon), label: p.display_name });
                }}
              >
                {p.display_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {result && status ? (
        <div role="status" className={`rounded-2xl border p-4 ${status.tone}`}>
          {picked?.label ? <p className="text-sm opacity-80">{picked.label}</p> : null}
          <p className="font-semibold">{status.title}</p>
          {result.zones.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {result.zones.map((z) => (
                <li key={`${z.properties.kind}-${z.properties.name}`}>
                  {z.properties.name} <span className="opacity-80">({z.properties.rule})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">Bản đồ này chưa vẽ khu quân sự, trụ sở cơ quan, khu đông người và đường hàng không, nên điểm này vẫn có thể thuộc khu vực cấm hoặc hạn chế bay. Bay trên 120 m luôn là khu vực hạn chế bay.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">Bấm lên bản đồ, tìm địa điểm hoặc dùng vị trí của bạn để xem điểm đó thuộc khu vực nào.</p>
      )}

      <a href={OFFICIAL_MAP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-sky-ink hover:underline underline-offset-4">
        Kiểm tra trên bản đồ chính thức của Bộ Quốc phòng <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
      </a>
    </div>
  );
}
