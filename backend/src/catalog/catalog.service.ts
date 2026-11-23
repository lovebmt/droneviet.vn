import { BadRequestException, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, In } from "typeorm";
import { PurchaseMode, ProductVariant } from "./entities/product-variant.entity";
import { Product, ProductKind, ProductStatus } from "./entities/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { InventoryItem } from "../inventory/entities/inventory-item.entity";
import type { CatalogFilter, PublicProductCard, PublicProductDetail } from "./catalog-public.types";
import { ComboItem } from "./entities/combo-item.entity";
import { ComboSizeTier } from "./entities/combo-size-tier.entity";
import { WebRevalidator } from "../common/web-revalidator";
import type { ReplaceComboItemsDto, ReplaceSizeTiersDto } from "./dto/combo.dto";
import type { UpdateProductDto, UpdateVariantDto } from "./dto/update-product.dto";

export type { PublicProductCard, PublicProductDetail } from "./catalog-public.types";

function purchaseModeRank(mode: PurchaseMode): number {
  switch (mode) {
    case PurchaseMode.CHECKOUT:
      return 0;
    case PurchaseMode.PREORDER:
      return 1;
    case PurchaseMode.QUOTE_ONLY:
      return 2;
  }
}

function isLowerPrice(
  candidate: ProductVariant,
  current: ProductVariant,
): boolean {
  if (purchaseModeRank(candidate.purchaseMode) !== purchaseModeRank(current.purchaseMode)) {
    return purchaseModeRank(candidate.purchaseMode) < purchaseModeRank(current.purchaseMode);
  }

  return candidate.priceVnd < current.priceVnd;
}

/** Units that can still be sold: on hand minus reserved, never negative. */
function availableStock(variant: ProductVariant): number {
  const inventory = variant.inventory;
  return inventory ? Math.max(0, inventory.onHand - inventory.reserved) : 0;
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Optional() private readonly revalidator?: WebRevalidator,
  ) {}

  /** Admin list: every status, with variants and stock. */
  async listForAdmin(): Promise<Product[]> {
    return this.dataSource.getRepository(Product).find({
      relations: { variants: { inventory: true } },
      order: { sortOrder: "ASC", name: "ASC" },
    });
  }

  async updateProduct(id: string, input: UpdateProductDto): Promise<Product> {
    const repository = this.dataSource.getRepository(Product);
    const product = await repository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    Object.assign(product, input);
    const saved = await repository.save(product);
    await this.revalidator?.revalidate(["catalog", `product:${saved.slug}`]);
    return saved;
  }

  async updateVariant(id: string, input: UpdateVariantDto): Promise<ProductVariant> {
    return this.dataSource.transaction(async (manager) => {
      const variant = await manager.getRepository(ProductVariant).findOne({ where: { id }, relations: { product: true } });
      if (!variant) {
        throw new NotFoundException("Variant not found");
      }
      const { stock, ...fields } = input;
      Object.assign(variant, fields);
      const saved = await manager.getRepository(ProductVariant).save(variant);
      if (stock !== undefined) {
        const inventory = manager.getRepository(InventoryItem);
        const existing = await inventory.findOneBy({ productVariantId: id });
        await inventory.save(existing ? Object.assign(existing, { onHand: stock }) : inventory.create({ productVariantId: id, onHand: stock, reserved: 0 }));
      }
      await this.revalidator?.revalidate(["catalog", `product:${variant.product.slug}`]);
      return saved;
    });
  }

  async replaceComboItems(comboId: string, input: ReplaceComboItemsDto): Promise<void> {
    const combo = await this.requireCombo(comboId);
    const slugs = input.items.map((item) => item.productSlug);
    const products = slugs.length
      ? await this.dataSource.getRepository(Product).find({ where: { slug: In(slugs) } })
      : [];
    const bySlug = new Map(products.map((product) => [product.slug, product]));
    const missing = slugs.filter((slug) => !bySlug.has(slug));
    if (missing.length) {
      throw new BadRequestException(`Unknown product slugs: ${missing.join(", ")}`);
    }

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ComboItem);
      await repository.delete({ comboId });
      await repository.save(
        input.items.map((item, index) =>
          repository.create({
            comboId,
            productId: bySlug.get(item.productSlug)!.id,
            quantity: item.quantity,
            note: item.note ?? null,
            sortOrder: index,
          }),
        ),
      );
    });
    await this.revalidator?.revalidate(["catalog", `product:${combo.slug}`]);
  }

  async replaceSizeTiers(comboId: string, input: ReplaceSizeTiersDto): Promise<void> {
    const combo = await this.requireCombo(comboId);
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ComboSizeTier);
      await repository.delete({ comboId });
      await repository.save(
        input.tiers.map((tier) =>
          repository.create({ comboId, students: tier.students, priceVnd: tier.priceVnd, label: tier.label ?? null }),
        ),
      );
    });
    await this.revalidator?.revalidate(["catalog", `product:${combo.slug}`]);
  }

  private async requireCombo(id: string): Promise<Product> {
    const combo = await this.dataSource.getRepository(Product).findOneBy({ id });
    if (!combo || combo.kind !== ProductKind.COMBO) {
      throw new NotFoundException("Combo not found");
    }
    return combo;
  }

  async listPublic(filter: CatalogFilter = {}): Promise<PublicProductCard[]> {
    const products = await this.dataSource.getRepository(Product).find({
      where: {
        status: ProductStatus.PUBLISHED,
        ...(filter.kind ? { kind: filter.kind as ProductKind } : {}),
        ...(filter.featured === undefined ? {} : { featured: filter.featured }),
      },
      relations: { variants: { inventory: true } },
      order: { sortOrder: "ASC", name: "ASC" },
    });
    const visible = filter.level
      ? products.filter((product) => (product.levels ?? []).includes(filter.level as never))
      : products;
    const tiers = await this.tiersByCombo(visible.filter((p) => p.kind === ProductKind.COMBO).map((p) => p.id));

    return visible.flatMap((product) => {
      const card = this.toCard(product, tiers.get(product.id) ?? []);
      return card ? [card] : [];
    });
  }

  /** Full product page data; 404 for unknown or unpublished slugs (spec §9.1). */
  async getPublicDetail(slug: string): Promise<PublicProductDetail> {
    const product = await this.dataSource.getRepository(Product).findOne({
      where: { slug, status: ProductStatus.PUBLISHED },
      relations: { variants: { inventory: true } },
    });
    const tiers = product ? (await this.tiersByCombo([product.id])).get(product.id) ?? [] : [];
    const card = product ? this.toCard(product, tiers) : null;
    if (!product || !card) {
      throw new NotFoundException("Product not found");
    }

    const items = await this.dataSource.getRepository(ComboItem).find({
      where: { comboId: product.id },
      relations: { product: { variants: { inventory: true } } },
      order: { sortOrder: "ASC" },
    });
    const comboItems = items.flatMap((item) => {
      const itemCard = item.product.status === ProductStatus.PUBLISHED ? this.toCard(item.product, []) : null;
      return itemCard ? [{ product: itemCard, quantity: item.quantity, note: item.note }] : [];
    });

    const compatibleProducts = product.compatibleWith?.length
      ? await this.dataSource.getRepository(Product).find({
          where: { slug: In(product.compatibleWith), status: ProductStatus.PUBLISHED },
          relations: { variants: { inventory: true } },
        })
      : [];

    return {
      ...card,
      summaryEn: product.summaryEn,
      gallery: product.gallery ?? [],
      specs: product.specs ?? [],
      inTheBox: product.inTheBox ?? [],
      faq: product.faq ?? [],
      brochureUrl: product.brochureUrl,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      variants: product.variants
        .filter((variant) => variant.isActive)
        .map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          title: variant.title,
          priceVnd: variant.priceVnd,
          compareAtVnd: variant.compareAtVnd,
          purchaseMode: variant.purchaseMode,
          stock: availableStock(variant),
        })),
      compatible: compatibleProducts.flatMap((p) => {
        const c = this.toCard(p, []);
        return c ? [c] : [];
      }),
      comboItems,
      sizeTiers: tiers
        .map((tier) => ({ students: tier.students, priceVnd: tier.priceVnd, label: tier.label }))
        .sort((a, b) => a.students - b.students),
    };
  }

  private async tiersByCombo(comboIds: string[]): Promise<Map<string, ComboSizeTier[]>> {
    const byCombo = new Map<string, ComboSizeTier[]>();
    if (comboIds.length === 0) {
      return byCombo;
    }
    for (const tier of await this.dataSource.getRepository(ComboSizeTier).find({ where: { comboId: In(comboIds) } })) {
      byCombo.set(tier.comboId, [...(byCombo.get(tier.comboId) ?? []), tier]);
    }
    return byCombo;
  }

  /** Combos are always quote-only; other products need an active variant to be listed. */
  private toCard(product: Product, tiers: ComboSizeTier[]): PublicProductCard | null {
    const base = {
      slug: product.slug,
      name: product.name,
      nameEn: product.nameEn ?? null,
      summary: product.summary,
      kind: product.kind,
      levels: product.levels ?? [],
      coverImageUrl: product.coverImageUrl,
      badge: product.badge ?? null,
      featured: product.featured ?? false,
    };

    if (product.kind === ProductKind.COMBO) {
      return {
        ...base,
        fromPriceVnd: tiers.length ? Math.min(...tiers.map((tier) => tier.priceVnd)) : null,
        purchaseMode: PurchaseMode.QUOTE_ONLY,
        inStock: true,
      };
    }

    const activeVariants = (product.variants ?? []).filter((variant) => variant.isActive);
    if (activeVariants.length === 0) {
      return null;
    }
    const startingVariant = activeVariants.reduce((current, candidate) =>
      isLowerPrice(candidate, current) ? candidate : current,
    );

    return {
      ...base,
      fromPriceVnd: startingVariant.priceVnd,
      purchaseMode: startingVariant.purchaseMode,
      inStock:
        startingVariant.purchaseMode !== PurchaseMode.CHECKOUT ||
        activeVariants.some((variant) => availableStock(variant) > 0),
    };
  }

  async createProduct(input: CreateProductDto): Promise<Product> {
    if (input.variants.some((variant) => !Number.isInteger(variant.priceVnd))) {
      throw new BadRequestException("Variant prices must be integer VND amounts");
    }

    return this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(Product);
      const product = await productRepository.save(
        productRepository.create({
        coverImageUrl: input.coverImageUrl ?? null,
        kind: input.kind,
        name: input.name,
        slug: input.slug,
        status: ProductStatus.DRAFT,
        summary: input.summary,
        variants: input.variants.map((variant) => ({
          isActive: true,
          priceVnd: variant.priceVnd,
          purchaseMode: variant.purchaseMode,
          sku: variant.sku,
          title: variant.title,
        })),
        }),
      );

      if (input.kind === ProductKind.COURSE) {
        return product;
      }

      const inventoryRepository = manager.getRepository(InventoryItem);
      await inventoryRepository.save(
        product.variants.map((variant, index) =>
          inventoryRepository.create({
            onHand: input.variants[index].stockOnHand,
            productVariantId: variant.id,
            reserved: 0,
          }),
        ),
      );

      return product;
    });
  }

  async publishProduct(productId: string): Promise<Product> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Product);
      const product = await repository.findOneByOrFail({ id: productId });

      product.status = ProductStatus.PUBLISHED;
      return repository.save(product);
    });
  }
}
