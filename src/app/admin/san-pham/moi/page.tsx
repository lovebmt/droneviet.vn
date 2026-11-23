"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Field, FormError, Input, Select, Textarea } from "@/components/forms/field";
import { KIND_LABEL, MODE_LABEL } from "@/components/admin/types";
import { adminError } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { slugify } from "@/lib/slug";

/** Creates a draft; details, images and publishing happen on the edit page. */
export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    setError(null);
    try {
      const product = await apiFetch<{ id: string }>("/admin/catalog/products", {
        method: "POST",
        body: JSON.stringify({
          name: text("name"),
          slug: text("slug"),
          summary: text("summary"),
          kind: text("kind"),
          variants: [{ sku: text("sku"), title: text("variantTitle") || "Tiêu chuẩn", priceVnd: Number(text("priceVnd")) || 0, stockOnHand: Number(text("stock")) || 0, purchaseMode: text("purchaseMode") }],
        }),
      });
      router.push(`/admin/san-pham/${product.id}`);
    } catch (e) {
      setError(adminError(e));
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/san-pham" className="text-sm text-muted hover:text-ink">Tất cả sản phẩm</Link>
      <h1 className="mt-1 text-3xl font-light tracking-tight">Thêm sản phẩm</h1>
      <p className="mt-1 text-muted">Sản phẩm mới là bản nháp. Thêm ảnh, thông số rồi chuyển sang “Đang bán” ở trang sửa.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field label="Tên sản phẩm" required><Input name="name" required value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} /></Field>
        <Field label="Đường dẫn (slug)" required hint="Chữ thường, số và dấu gạch ngang"><Input name="slug" required pattern="[a-z0-9-]+" value={slug} onChange={(e) => setSlug(e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Mô tả ngắn" required><Textarea name="summary" required rows={2} /></Field></div>
        <Field label="Loại">
          <Select name="kind" defaultValue="drone">{["drone", "part", "accessory", "education_kit", "combo"].map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</Select>
        </Field>
        <Field label="Cách bán">
          <Select name="purchaseMode" defaultValue="checkout">{Object.entries(MODE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        </Field>
        <Field label="Mã SKU" required><Input name="sku" required /></Field>
        <Field label="Tên phiên bản"><Input name="variantTitle" placeholder="Tiêu chuẩn" /></Field>
        <Field label="Giá (₫)" required><Input name="priceVnd" type="number" min={0} required /></Field>
        <Field label="Tồn kho" required><Input name="stock" type="number" min={0} required defaultValue={0} /></Field>
        <div className="space-y-4 sm:col-span-2">
          <FormError message={error} />
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Đang tạo…" : "Tạo bản nháp"}</Button>
        </div>
      </form>
    </div>
  );
}
