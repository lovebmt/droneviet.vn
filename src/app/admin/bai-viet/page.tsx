"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { adminError, useAdminData } from "@/components/admin/use-admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

type Row = { slug: string; title: string; status: string; publishedAt: string | null; updatedAt: string; tags: string[] | null };

function ArticleRow({ article, onChanged }: { article: Row; onChanged(): void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = article.status === "published";

  async function toggle() {
    if (published && !window.confirm(`Ẩn bài “${article.title}” khỏi website?`)) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/content/articles/${encodeURIComponent(article.slug)}/${published ? "unpublish" : "publish"}`, { method: "POST" });
      onChanged();
    } catch (e) {
      setError(adminError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li>
      <fieldset aria-label={article.title} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
        <div className="min-w-0">
          <p className="font-semibold">{article.title}</p>
          <p className="text-sm text-muted">{article.slug}, sửa {formatDate(article.updatedAt)}{article.publishedAt ? `, đăng ${formatDate(article.publishedAt)}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={published ? "teal" : "neutral"}>{published ? "Đang hiển thị" : "Bản nháp"}</Badge>
          {published ? <a href={`/r-d/${article.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-sky-ink">Xem <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" /></a> : null}
          <Button type="button" variant={published ? "ghost" : "primary"} disabled={busy} onClick={() => void toggle()}>{published ? "Ẩn bài" : "Đăng bài"}</Button>
        </div>
        {error ? <p role="alert" className="w-full text-sm text-red-800">{error}</p> : null}
      </fieldset>
    </li>
  );
}

export default function AdminArticlesPage() {
  const { data, error, reload } = useAdminData<Row[]>("/admin/content/articles");
  return (
    <div>
      <h1 className="text-3xl font-light tracking-tight">Bài viết R&amp;D</h1>
      <p className="mt-1 max-w-2xl text-muted">Bài được soạn bằng skill viết bài R&amp;D (Claude Code) và gửi lên dưới dạng bản nháp hoặc đăng ngay. Tại đây bạn đăng, ẩn và xem bài.</p>
      {error ? <p role="alert" className="mt-6">{error}</p> : null}
      {!data && !error ? <p className="mt-6 text-muted">Đang tải…</p> : null}
      {data ? (data.length ? <ul className="mt-6 space-y-3">{data.map((a) => <ArticleRow key={a.slug} article={a} onChanged={reload} />)}</ul> : <p className="mt-6 text-muted">Chưa có bài viết.</p>) : null}
    </div>
  );
}
