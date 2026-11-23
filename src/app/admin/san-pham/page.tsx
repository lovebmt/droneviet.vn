"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Input, Select } from "@/components/forms/field";
import { type AdminProduct, KIND_LABEL, STATUS_LABEL } from "@/components/admin/types";
import { useAdminData } from "@/components/admin/use-admin-data";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatVnd } from "@/lib/format";
import { fold } from "@/lib/slug";

export default function AdminProductsPage() {
  const { data, error } = useAdminData<AdminProduct[]>("/admin/catalog/products");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const rows = (data ?? []).filter((p) => p.kind !== "course" && (!kind || p.kind === kind) && (!q || fold(`${p.name} ${p.slug}`).includes(fold(q))));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-light tracking-tight">Sản phẩm & combo</h1>
        <LinkButton href="/admin/san-pham/moi"><Plus size={16} strokeWidth={1.75} aria-hidden="true" /> Thêm sản phẩm</LinkButton>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Input aria-label="Tìm sản phẩm" placeholder="Tìm theo tên hoặc slug" value={q} onChange={(e) => setQ(e.target.value)} className="mt-0 max-w-xs" />
        <Select aria-label="Loại" value={kind} onChange={(e) => setKind(e.target.value)} className="mt-0 w-auto">
          <option value="">Tất cả loại</option>
          {["combo", "drone", "education_kit", "part", "accessory"].map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </Select>
      </div>
      {error ? <p role="alert" className="mt-6">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-muted">Đang tải…</p> : null}
      {data ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sky-50 text-muted">
              <tr><th className="p-3 font-semibold">Sản phẩm</th><th className="p-3 font-semibold">Loại</th><th className="p-3 font-semibold">Trạng thái</th><th className="p-3 text-right font-semibold">Giá</th><th className="p-3 text-right font-semibold">Tồn kho</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const v = p.variants[0];
                const stock = p.variants.reduce((n, x) => n + Math.max(0, (x.inventory?.onHand ?? 0) - (x.inventory?.reserved ?? 0)), 0);
                return (
                  <tr key={p.id}>
                    <td className="p-3"><Link href={`/admin/san-pham/${p.id}`} className="font-semibold hover:text-sky-ink">{p.name}</Link><span className="block text-xs text-muted">{p.slug}</span></td>
                    <td className="p-3">{KIND_LABEL[p.kind] ?? p.kind}</td>
                    <td className="p-3"><Badge tone={p.status === "published" ? "teal" : "neutral"}>{STATUS_LABEL[p.status] ?? p.status}</Badge></td>
                    <td className="p-3 text-right tabular-nums">{v ? formatVnd(v.priceVnd) : "—"}</td>
                    <td className={`p-3 text-right tabular-nums ${p.variants.length && stock === 0 ? "font-semibold text-red-800" : ""}`}>{p.variants.length ? stock : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length ? <p className="p-6 text-center text-muted">Không có sản phẩm phù hợp.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
