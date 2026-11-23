import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { MarkdownRendererService } from "./markdown-renderer.service";
import { Article, ContentStatus } from "./entities/article.entity";
import { ContentRevision } from "./entities/content-revision.entity";
import { CatalogService, type PublicProductCard } from "../catalog/catalog.service";
import { WebRevalidator } from "../common/web-revalidator";
import type { UpsertArticleDto } from "./dto/upsert-article.dto";

export interface PublicArticleSummary {
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  tags: string[];
  levels: string[];
  kind: string;
  publishedAt: Date | null;
  readingMinutes: number | null;
}

export interface PublicArticle extends PublicArticleSummary {
  bodyMarkdown: string;
  attachments: Array<{ url: string; label: string }>;
  relatedProducts: PublicProductCard[];
  seoTitle: string | null;
  seoDescription: string | null;
}

/** ~200 words a minute, at least 1. */
function readingMinutes(markdown: string): number {
  const words = markdown.replace(/[#>*_`\[\]()!:{}-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Legal guides live under /dao-tao, not in R&D lists, search or home news. */
export const LEGAL_KIND = "phap-ly";

@Injectable()
export class ContentService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly markdownRenderer: MarkdownRendererService,
    @Optional() private readonly catalog?: CatalogService,
    @Optional() private readonly revalidator?: WebRevalidator,
  ) {}

  /** Create or update an article by slug; a published article stays published and gets a new revision. */
  async upsertArticle(slug: string, input: UpsertArticleDto): Promise<Article> {
    const repository = this.dataSource.getRepository(Article);
    const existing = await repository.findOneBy({ slug });
    const article = existing ?? repository.create({ slug, status: ContentStatus.DRAFT, revisionNumber: 0, renderedHtml: null, tableOfContents: null });
    Object.assign(article, {
      title: input.title,
      bodyMarkdown: input.bodyMarkdown,
      summary: input.summary ?? article.summary ?? null,
      coverImageUrl: input.coverImageUrl ?? article.coverImageUrl ?? null,
      seoTitle: input.seoTitle ?? article.seoTitle ?? null,
      seoDescription: input.seoDescription ?? article.seoDescription ?? null,
      locale: input.locale ?? article.locale ?? "vi",
      tags: input.tags ?? article.tags ?? [],
      levels: input.levels ?? article.levels ?? [],
      attachments: input.attachments ?? article.attachments ?? [],
      relatedProductSlugs: input.relatedProductSlugs ?? article.relatedProductSlugs ?? [],
      kind: input.kind ?? article.kind ?? "guide",
      readingMinutes: readingMinutes(input.bodyMarkdown),
    });
    const saved = await repository.save(article);
    if (saved.status === ContentStatus.PUBLISHED) {
      await this.recordRevision(saved);
      await this.revalidator?.revalidate(["articles", `article:${slug}`]);
    }
    return saved;
  }

  async setArticlePublished(slug: string, published: boolean): Promise<Article> {
    const repository = this.dataSource.getRepository(Article);
    const article = await repository.findOneBy({ slug });
    if (!article) {
      throw new NotFoundException("Article not found");
    }
    article.status = published ? ContentStatus.PUBLISHED : ContentStatus.DRAFT;
    if (published) {
      article.publishedAt ??= new Date();
    }
    const saved = await repository.save(article);
    if (published) {
      await this.recordRevision(saved);
    }
    await this.revalidator?.revalidate(["articles", `article:${slug}`]);
    return saved;
  }

  listAllArticles(): Promise<Article[]> {
    return this.dataSource.getRepository(Article).find({ order: { updatedAt: "DESC" } });
  }

  async listPublicArticles(filter: { tag?: string; level?: string; limit?: number; kind?: string }): Promise<PublicArticleSummary[]> {
    const articles = await this.dataSource.getRepository(Article).find({
      where: { status: ContentStatus.PUBLISHED },
      order: { publishedAt: "DESC" },
    });
    return articles
      .filter((a) => (filter.kind ? a.kind === filter.kind : a.kind !== LEGAL_KIND))
      .filter((a) => !filter.tag || (a.tags ?? []).includes(filter.tag))
      .filter((a) => !filter.level || (a.levels ?? []).includes(filter.level))
      .slice(0, filter.limit && filter.limit > 0 ? filter.limit : undefined)
      .map((a) => this.toSummary(a));
  }

  async getPublicArticle(slug: string): Promise<PublicArticle> {
    const article = await this.dataSource.getRepository(Article).findOneBy({ slug, status: ContentStatus.PUBLISHED });
    if (!article) {
      throw new NotFoundException("Article not found");
    }
    return {
      ...this.toSummary(article),
      bodyMarkdown: article.bodyMarkdown,
      attachments: article.attachments ?? [],
      relatedProducts: (await this.catalog?.cardsBySlugs(article.relatedProductSlugs ?? [])) ?? [],
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
    };
  }

  private toSummary(a: Article): PublicArticleSummary {
    return {
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      coverImageUrl: a.coverImageUrl,
      tags: a.tags ?? [],
      levels: a.levels ?? [],
      kind: a.kind ?? "guide",
      publishedAt: a.publishedAt,
      readingMinutes: a.readingMinutes,
    };
  }

  /** Revisions keep a server-rendered snapshot; the web renders Markdown (and directives) itself. */
  private async recordRevision(article: Article): Promise<void> {
    const rendered = await this.markdownRenderer.render(article.bodyMarkdown);
    const repository = this.dataSource.getRepository(ContentRevision);
    article.revisionNumber += 1;
    await this.dataSource.getRepository(Article).save(article);
    await repository.save(
      repository.create({
        articleId: article.id,
        bodyMarkdown: article.bodyMarkdown,
        metadata: {
          seoDescription: article.seoDescription,
          seoTitle: article.seoTitle,
          summary: article.summary,
          title: article.title,
        },
        renderedHtml: rendered.html,
        revisionNumber: article.revisionNumber,
        tableOfContents: rendered.tableOfContents,
      }),
    );
  }
}
