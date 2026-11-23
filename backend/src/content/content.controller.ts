import { Controller, Get, Param, Query } from "@nestjs/common";
import { ContentService } from "./content.service";

@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("articles")
  list(@Query("tag") tag?: string, @Query("level") level?: string, @Query("limit") limit?: string) {
    return this.content.listPublicArticles({ tag, level, limit: limit ? Number(limit) : undefined });
  }

  @Get("articles/:slug")
  get(@Param("slug") slug: string) {
    return this.content.getPublicArticle(slug);
  }
}
