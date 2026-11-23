import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ContentTokenGuard } from "../auth/content-token.guard";
import { ContentService } from "./content.service";
import { UpsertArticleDto } from "./dto/upsert-article.dto";

/** Article publishing for the R&D skill (content token) and super admins (spec §9.4). */
@Controller("admin/content/articles")
@UseGuards(ContentTokenGuard)
export class AdminArticlesController {
  constructor(private readonly content: ContentService) {}

  @Get()
  list() {
    return this.content.listAllArticles();
  }

  @Put(":slug")
  upsert(@Param("slug") slug: string, @Body() input: UpsertArticleDto) {
    return this.content.upsertArticle(slug, input);
  }

  @Post(":slug/publish")
  publish(@Param("slug") slug: string) {
    return this.content.setArticlePublished(slug, true);
  }

  @Post(":slug/unpublish")
  unpublish(@Param("slug") slug: string) {
    return this.content.setArticlePublished(slug, false);
  }
}
