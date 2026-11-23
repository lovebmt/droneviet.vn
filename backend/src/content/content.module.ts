import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { CatalogModule } from "../catalog/catalog.module";
import { AdminArticlesController } from "./admin-articles.controller";
import { AdminContentController } from "./admin-content.controller";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { MarkdownRendererService } from "./markdown-renderer.service";
import { Article } from "./entities/article.entity";
import { ContentRevision } from "./entities/content-revision.entity";

@Module({
  imports: [AuditModule, AuthModule, CatalogModule],
  controllers: [AdminContentController, AdminArticlesController, ContentController],
  providers: [ContentService, MarkdownRendererService],
  exports: [ContentService, MarkdownRendererService],
})
export class ContentModule {}
