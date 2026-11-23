import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/entities/user.entity";
import { CatalogService } from "./catalog.service";
import { ReplaceComboItemsDto, ReplaceSizeTiersDto } from "./dto/combo.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto, UpdateVariantDto } from "./dto/update-product.dto";

@Controller("admin/catalog")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
export class AdminCatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly auditService: AuditService,
  ) {}

  @Post("products")
  async createProduct(
    @Body() input: CreateProductDto,
    @Req() request: { user?: { sub?: string } },
  ) {
    const product = await this.catalogService.createProduct(input);
    await this.auditService.record({
      action: "catalog.product.created",
      actorId: request.user?.sub,
      aggregateId: product.id,
      aggregateType: "product",
      nextState: { status: product.status },
    });
    return product;
  }

  @Post("products/:id/publish")
  async publishProduct(
    @Param("id") id: string,
    @Req() request: { user?: { sub?: string } },
  ) {
    const product = await this.catalogService.publishProduct(id);
    await this.auditService.record({
      action: "catalog.product.published",
      actorId: request.user?.sub,
      aggregateId: product.id,
      aggregateType: "product",
      nextState: { status: product.status },
    });
    return product;
  }

  @Get("products")
  listProducts() {
    return this.catalogService.listForAdmin();
  }

  @Get("products/:id")
  productDetail(@Param("id", ParseUUIDPipe) id: string) {
    return this.catalogService.detailForAdmin(id);
  }

  @Patch("products/:id")
  updateProduct(@Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateProductDto) {
    return this.catalogService.updateProduct(id, input);
  }

  @Patch("variants/:id")
  updateVariant(@Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateVariantDto) {
    return this.catalogService.updateVariant(id, input);
  }

  @Put("products/:id/combo-items")
  async replaceComboItems(@Param("id", ParseUUIDPipe) id: string, @Body() input: ReplaceComboItemsDto) {
    await this.catalogService.replaceComboItems(id, input);
    return { ok: true };
  }

  @Put("products/:id/size-tiers")
  async replaceSizeTiers(@Param("id", ParseUUIDPipe) id: string, @Body() input: ReplaceSizeTiersDto) {
    await this.catalogService.replaceSizeTiers(id, input);
    return { ok: true };
  }
}
