import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/entities/user.entity";
import { ContentService } from "./content.service";
import { PublishProductContentDto } from "./dto/publish-product-content.dto";

@Controller("admin/content")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.CATALOG_MANAGER,
  UserRole.INSTRUCTOR,
)
export class AdminContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly auditService: AuditService,
  ) {}

  @Post("products/:id/publish")
  async publishProductContent(
    @Param("id") id: string,
    @Body() input: PublishProductContentDto,
    @Req() request: { user?: { sub?: string } },
  ) {
    const content = await this.contentService.publishProductContent(id, input);
    await this.auditService.record({
      action: "content.product.published",
      actorId: request.user?.sub,
      aggregateId: id,
      aggregateType: "product",
      nextState: { locale: content.locale },
    });
    return content;
  }
}
