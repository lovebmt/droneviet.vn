import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  listProducts(
    @Query("kind") kind?: string,
    @Query("level") level?: string,
    @Query("featured") featured?: string,
  ) {
    return this.catalogService.listPublic({
      kind,
      level,
      featured: featured === undefined ? undefined : featured === "true",
    });
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalogService.getPublicDetail(slug);
  }
}
