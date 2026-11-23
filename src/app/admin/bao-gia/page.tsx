"use client";

import Link from "next/link";
import { useState } from "react";
import { Select } from "@/components/forms/field";
import { adminError, useAdminData } from "@/components/admin/use-admin-data";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

type Quote = {
  id: string; organization: string; organizationType: string | null; contactName: string; phone: string; email: string | null;
  students: number | null; quantity: number; productSlug: string | null; requirements: string | null; status: string; createdAt: string;
};

const STATUS: Record<string, string> = { new: "Mới", qualified: "Đã liên hệ", sent: "Đã gửi báo giá", converted: "Đã chốt", lost: "Không thành" };
const ORG: Record<string, string> = { school: "Trường phổ thông", center: "Trung tâm STEM", university: "Đại học, cao đẳng", company: "Doanh nghiệp", other: "Khác" };

function QuoteRow({ quote }: { quote: Quote }) {
  const [status, setStatus] = useState(quote.status);
  const [error, setError] = useState<string | null>(null);
  const zalo = quote.phone.replace(/\D/g, "");

  async function change(next: string) {
    const previous = status;
    setStatus(next);
    setError(null);
    try {
      await apiFetch(`/admin/quotes/${quote.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    } catch (e) {
      setStatus(previous);
      setError(adminError(e));
    }
  }

  return (
    <li>
      <fieldset aria-label={quote.organization} className="rounded-2xl border border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{quote.organization}</p>
            <p className="text-sm text-muted">{formatDate(quote.createdAt)}{quote.organizationType ? `, ${ORG[quote.organizationType] ?? quote.organizationType}` : ""}</p>
          </div>
          <label className="text-sm">
            <span className="sr-only">Trạng thái</span>
            <Select aria-label="Trạng thái" value={status} onChange={(e) => void change(e.target.value)} className="mt-0 w-auto">
              {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <p>{quote.contactName}</p>
            <p className="flex flex-wrap gap-x-4">
              <a href={`tel:${zalo}`} className="font-semibold text-sky">{quote.phone}</a>
              <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer" className="text-sky">Nhắn Zalo</a>
              {quote.email ? <a href={`mailto:${quote.email}`} className="text-sky">{quote.email}</a> : null}
            </p>
          </div>
          <div className="space-y-1">
            {quote.productSlug ? <p>Sản phẩm: <Link href={`/cua-hang/combo/${quote.productSlug}`} className="text-sky">{quote.productSlug}</Link></p> : null}
            <p>{quote.students ? `${quote.students} học sinh, ` : ""}{quote.quantity} lớp hoặc bộ</p>
          </div>
        </div>
        {quote.requirements ? <p className="mt-3 whitespace-pre-line rounded-xl bg-sky-50 p-3 text-sm">{quote.requirements}</p> : null}
        {error ? <p role="alert" className="mt-3 text-sm text-red-800">{error}</p> : null}
      </fieldset>
    </li>
  );
}

export default function AdminQuotesPage() {
  const [filter, setFilter] = useState("");
  const { data, error } = useAdminData<Quote[]>(`/admin/quotes${filter ? `?status=${filter}` : ""}`);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-light tracking-tight">Yêu cầu báo giá</h1>
        <Select aria-label="Lọc theo trạng thái" value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-0 w-auto">
          <option value="">Tất cả</option>
          {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </div>
      {error ? <p role="alert" className="mt-6">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-muted">Đang tải…</p> : null}
      {data ? (data.length ? <ul className="mt-6 space-y-3">{data.map((q) => <QuoteRow key={q.id} quote={q} />)}</ul> : <p className="mt-6 text-muted">Chưa có yêu cầu nào.</p>) : null}
    </div>
  );
}
