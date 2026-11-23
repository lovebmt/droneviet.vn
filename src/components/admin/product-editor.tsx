"use client";
/* eslint-disable @next/next/no-img-element -- admin thumbnails of arbitrary uploaded media */

import Link from "next/link";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { productHref } from "@/components/catalog/product-tile";
import { Panel, SaveStatus } from "./admin-ui";
import { MediaUpload } from "./image-upload";
import { useSave } from "./save-state";
import { faqFromText, faqToText, linesFromText, specsFromText, specsToText } from "./text-formats";
import { type AdminProduct, type AdminProductDetail, type AdminVariant, KIND_LABEL, MODE_LABEL, STATUS_LABEL } from "./types";
import { useAdminData } from "./use-admin-data";

const LEVEL_OPTIONS = [
  { value: "tieu-hoc", label: "Tiểu học" },
  { value: "thcs", label: "THCS" },
  { value: "thpt", label: "THPT" },
  { value: "dai-hoc", label: "Đại học" },
  { value: "quoc-te", label: "Quốc tế" },
];

const nullable = (v: string) => (v.trim() ? v.trim() : null);

function InfoForm({ product, onSaved }: { product: AdminProductDetail; onSaved(): void }) {
  const save = useSave();
  const [cover, setCover] = useState(product.coverImageUrl);
  const [gallery, setGallery] = useState(product.gallery);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "");
    const ok = await save.run(`/admin/catalog/products/${product.id}`, "PATCH", {
      name: text("name").trim(),
      nameEn: nullable(text("nameEn")),
      summary: text("summary").trim(),
      summaryEn: nullable(text("summaryEn")),
      status: text("status"),
      badge: nullable(text("badge")),
      featured: f.get("featured") === "on",
      sortOrder: Number(text("sortOrder")) || 0,
      levels: f.getAll("levels").map(String),
      coverImageUrl: cover,
      gallery,
      specs: specsFromText(text("specs")),
      inTheBox: linesFromText(text("inTheBox")),
      faq: faqFromText(text("faq")),
      brochureUrl: nullable(text("brochureUrl")),
      seoTitle: nullable(text("seoTitle")),
      seoDescription: nullable(text("seoDescription")),
    });
    if (ok) onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Panel title="Thông tin">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên sản phẩm" required><Input name="name" required defaultValue={product.name} /></Field>
          <Field label="Tên tiếng Anh"><Input name="nameEn" defaultValue={product.nameEn ?? ""} /></Field>
          <div className="sm:col-span-2"><Field label="Mô tả ngắn" required><Textarea name="summary" required rows={2} defaultValue={product.summary} /></Field></div>
          <div className="sm:col-span-2"><Field label="Mô tả ngắn tiếng Anh"><Textarea name="summaryEn" rows={2} defaultValue={product.summaryEn ?? ""} /></Field></div>
          <Field label="Trạng thái">
            <Select name="status" defaultValue={product.status}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Nhãn nổi bật" hint="Ví dụ: Bán chạy, Mới"><Input name="badge" defaultValue={product.badge ?? ""} /></Field>
          <Field label="Thứ tự hiển thị" hint="Số nhỏ hiện trước"><Input name="sortOrder" type="number" defaultValue={product.sortOrder} /></Field>
          <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
            <input type="checkbox" name="featured" defaultChecked={product.featured} className="h-4 w-4 accent-[#0B6FE0]" /> Hiện ở trang chủ
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold">Cấp học</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {LEVEL_OPTIONS.map((l) => (
                <label key={l.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="levels" value={l.value} defaultChecked={product.levels.includes(l.value)} className="h-4 w-4 accent-[#0B6FE0]" /> {l.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Panel>

      <Panel title="Ảnh">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            {cover ? <img src={cover} alt="" className="h-20 w-28 rounded-xl object-cover" /> : <span className="grid h-20 w-28 place-items-center rounded-xl bg-sky-50 text-xs text-muted">Chưa có ảnh</span>}
            <MediaUpload label="Tải ảnh đại diện" alt={product.name} onUploaded={(m) => setCover(m.url)} />
            {cover ? <button type="button" className="text-sm text-muted underline" onClick={() => setCover(null)}>Bỏ ảnh</button> : null}
          </div>
          <div>
            <p className="text-sm font-semibold">Bộ sưu tập</p>
            <ul className="mt-2 space-y-2">
              {gallery.map((g, i) => (
                <li key={g.url} className="flex items-center gap-3">
                  <img src={g.url} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  <Input aria-label={`Mô tả ảnh ${i + 1}`} value={g.alt} onChange={(e) => setGallery(gallery.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} className="mt-0" />
                  <button type="button" aria-label={`Xóa ảnh ${i + 1}`} onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-sky-50"><Trash2 size={16} strokeWidth={1.75} aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
            <div className="mt-3"><MediaUpload label="Thêm ảnh" alt={product.name} onUploaded={(m) => setGallery([...gallery, { url: m.url, alt: product.name }])} /></div>
          </div>
          <p className="text-sm text-muted">Ảnh mới được lưu khi bấm “Lưu thông tin”. Ghi nguồn ảnh trong mô tả nếu ảnh có giấy phép.</p>
        </div>
      </Panel>

      <Panel title="Nội dung chi tiết">
        <div className="grid gap-4">
          <Field label="Thông số kỹ thuật" hint="Mỗi dòng “Nhãn: Giá trị”; dòng “## Tên nhóm” để chia nhóm.">
            <Textarea name="specs" rows={6} defaultValue={specsToText(product.specs)} className="font-mono text-sm" />
          </Field>
          <Field label={product.kind === "combo" ? "Dịch vụ đi kèm" : "Trong hộp có gì"} hint="Mỗi dòng một mục.">
            <Textarea name="inTheBox" rows={4} defaultValue={product.inTheBox.join("\n")} />
          </Field>
          <Field label="Câu hỏi thường gặp" hint="“Hỏi: …” rồi “Đáp: …”, cách nhau một dòng trống.">
            <Textarea name="faq" rows={6} defaultValue={faqToText(product.faq)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link brochure (PDF)"><Input name="brochureUrl" type="url" defaultValue={product.brochureUrl ?? ""} /></Field>
            <Field label="Tiêu đề SEO"><Input name="seoTitle" defaultValue={product.seoTitle ?? ""} /></Field>
            <div className="sm:col-span-2"><Field label="Mô tả SEO"><Textarea name="seoDescription" rows={2} defaultValue={product.seoDescription ?? ""} /></Field></div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={save.state === "saving"}>{save.state === "saving" ? "Đang lưu…" : "Lưu thông tin"}</Button>
        <SaveStatus state={save.state} error={save.error} />
      </div>
    </form>
  );
}

function VariantRow({ variant }: { variant: AdminVariant }) {
  const save = useSave();
  const [price, setPrice] = useState(String(variant.priceVnd));
  const [compareAt, setCompareAt] = useState(variant.compareAtVnd === null ? "" : String(variant.compareAtVnd));
  const [stock, setStock] = useState(String(variant.inventory?.onHand ?? 0));
  const [mode, setMode] = useState(variant.purchaseMode);

  return (
    <fieldset aria-label={`Phiên bản ${variant.title}`} className="grid gap-3 rounded-xl bg-sky-50 p-4 sm:grid-cols-[1fr_9rem_9rem_7rem_10rem] sm:items-end">
      <div>
        <p className="font-semibold">{variant.title}</p>
        <p className="text-xs text-muted">SKU {variant.sku}{variant.inventory?.reserved ? `, đang giữ ${variant.inventory.reserved}` : ""}</p>
      </div>
      <Field label="Giá (₫)"><Input type="number" min={0} value={price} onChange={(e) => { setPrice(e.target.value); save.reset(); }} /></Field>
      <Field label="Giá gốc (₫)"><Input type="number" min={0} value={compareAt} onChange={(e) => setCompareAt(e.target.value)} /></Field>
      <Field label="Tồn kho"><Input type="number" min={0} value={stock} onChange={(e) => { setStock(e.target.value); save.reset(); }} /></Field>
      <Field label="Cách bán">
        <Select value={mode} onChange={(e) => setMode(e.target.value as AdminVariant["purchaseMode"])}>
          {Object.entries(MODE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-5">
        <Button
          type="button"
          variant="secondary"
          disabled={save.state === "saving"}
          onClick={() => void save.run(`/admin/catalog/variants/${variant.id}`, "PATCH", {
            priceVnd: Number(price),
            compareAtVnd: compareAt === "" ? null : Number(compareAt),
            stock: Number(stock),
            purchaseMode: mode,
          })}
        >
          Lưu phiên bản
        </Button>
        <SaveStatus state={save.state} error={save.error} />
      </div>
    </fieldset>
  );
}

function ComboEditor({ product, catalog }: { product: AdminProductDetail; catalog: AdminProduct[] }) {
  const save = useSave();
  const [items, setItems] = useState(product.comboItems);
  const [tiers, setTiers] = useState(product.sizeTiers.map((t) => ({ students: String(t.students), priceVnd: String(t.priceVnd), label: t.label ?? "" })));
  const choices = catalog.filter((p) => p.kind !== "combo" && p.kind !== "course" && !items.some((i) => i.productSlug === p.slug));

  async function submit() {
    const ok = await save.run(`/admin/catalog/products/${product.id}/combo-items`, "PUT", {
      items: items.map((i) => ({ productSlug: i.productSlug, quantity: i.quantity, note: i.note })),
    });
    if (ok) {
      await save.run(`/admin/catalog/products/${product.id}/size-tiers`, "PUT", {
        tiers: tiers.filter((t) => t.students && t.priceVnd).map((t) => ({ students: Number(t.students), priceVnd: Number(t.priceVnd), label: t.label.trim() || null })),
      });
    }
  }

  return (
    <Panel title="Thành phần combo">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item.productSlug} className="grid grid-cols-[5rem_1fr_2.25rem] items-end gap-3 sm:grid-cols-[5rem_1fr_14rem_2.25rem]">
            <Input aria-label={`Số lượng ${item.productName}`} type="number" min={1} value={item.quantity} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x)))} />
            <span className="pb-2.5 font-semibold">{item.productName}</span>
            <Input aria-label={`Ghi chú ${item.productName}`} placeholder="Ghi chú" value={item.note ?? ""} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, note: e.target.value || null } : x)))} className="max-sm:hidden" />
            <button type="button" aria-label={`Bỏ ${item.productName}`} onClick={() => setItems(items.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-sky-50"><Trash2 size={16} strokeWidth={1.75} aria-hidden="true" /></button>
          </li>
        ))}
      </ul>
      {choices.length ? (
        <label className="mt-4 block max-w-md text-sm">
          <span className="font-semibold">Thêm sản phẩm</span>
          <Select value="" onChange={(e) => { const p = catalog.find((x) => x.slug === e.target.value); if (p) setItems([...items, { productSlug: p.slug, productName: p.name, quantity: 1, note: null }]); }} >
            <option value="">Chọn sản phẩm…</option>
            {choices.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
          </Select>
        </label>
      ) : null}

      <h3 className="mt-8 font-semibold">Bậc giá theo quy mô lớp</h3>
      <p className="text-sm text-muted">Để trống thì trang combo hiện “Liên hệ báo giá”.</p>
      <ul className="mt-3 space-y-2">
        {tiers.map((t, i) => (
          <li key={i} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[9rem_12rem_1fr_2.25rem]">
            <Field label={`Số học sinh bậc ${i + 1}`}><Input type="number" min={1} value={t.students} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, students: e.target.value } : x)))} /></Field>
            <Field label={`Giá bậc ${i + 1} (₫)`}><Input type="number" min={1} value={t.priceVnd} onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, priceVnd: e.target.value } : x)))} /></Field>
            <Field label={`Nhãn bậc ${i + 1}`}><Input value={t.label} placeholder="Tùy chọn" onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
            <button type="button" aria-label={`Xóa bậc ${i + 1}`} onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="mb-1 grid h-9 w-9 place-items-center rounded-full hover:bg-sky-50"><Trash2 size={16} strokeWidth={1.75} aria-hidden="true" /></button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setTiers([...tiers, { students: "", priceVnd: "", label: "" }])} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky"><Plus size={16} strokeWidth={1.75} aria-hidden="true" /> Thêm bậc giá</button>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="button" onClick={() => void submit()} disabled={save.state === "saving"}>Lưu combo</Button>
        <SaveStatus state={save.state} error={save.error} />
      </div>
    </Panel>
  );
}

export function ProductEditor({ id }: { id: string }) {
  const { data: product, error, reload } = useAdminData<AdminProductDetail>(`/admin/catalog/products/${id}`);
  const { data: catalog } = useAdminData<AdminProduct[]>(product?.kind === "combo" ? "/admin/catalog/products" : null);

  if (error) return <p role="alert">{error}</p>;
  if (!product) return <p className="text-muted">Đang tải sản phẩm…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/san-pham" className="text-sm text-muted hover:text-ink">Tất cả sản phẩm</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-light tracking-tight">{product.name}</h1>
          <span className="text-sm text-muted">{KIND_LABEL[product.kind] ?? product.kind}, {STATUS_LABEL[product.status] ?? product.status}</span>
          {product.status === "published" ? (
            <a href={productHref(product)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-sky">Xem trên web <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" /></a>
          ) : null}
        </div>
      </div>
      <InfoForm product={product} onSaved={reload} />
      {product.variants.length ? (
        <Panel title="Giá và tồn kho">
          <div className="space-y-3">{product.variants.map((v) => <VariantRow key={v.id} variant={v} />)}</div>
        </Panel>
      ) : null}
      {product.kind === "combo" && catalog ? <ComboEditor product={product} catalog={catalog} /> : null}
    </div>
  );
}
