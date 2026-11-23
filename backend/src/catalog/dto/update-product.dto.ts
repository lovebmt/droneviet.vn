import { Type } from "class-transformer";
import {
  IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested,
} from "class-validator";
import { PurchaseMode } from "../entities/product-variant.entity";
import { ProductKind, ProductStatus } from "../entities/product.entity";

const LEVELS = ["tieu-hoc", "thcs", "thpt", "dai-hoc", "quoc-te"];

class ImageDto {
  @IsString() url!: string;
  @IsString() alt!: string;
}

class SpecItemDto {
  @IsString() label!: string;
  @IsString() value!: string;
}

class SpecGroupDto {
  @IsString() group!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SpecItemDto) items!: SpecItemDto[];
}

class FaqDto {
  @IsString() q!: string;
  @IsString() a!: string;
}

/** Every field optional: PATCH semantics (spec §9.1). */
export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameEn?: string | null;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() summaryEn?: string | null;
  @IsOptional() @IsEnum(ProductKind) kind?: ProductKind;
  @IsOptional() @IsEnum(ProductStatus) status?: ProductStatus;
  @IsOptional() @IsString() coverImageUrl?: string | null;
  @IsOptional() @IsArray() @IsIn(LEVELS, { each: true }) levels?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ImageDto) gallery?: ImageDto[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SpecGroupDto) specs?: SpecGroupDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) inTheBox?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FaqDto) faq?: FaqDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) compatibleWith?: string[];
  @IsOptional() @IsString() brochureUrl?: string | null;
  @IsOptional() @IsString() seoTitle?: string | null;
  @IsOptional() @IsString() seoDescription?: string | null;
  @IsOptional() @IsString() badge?: string | null;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
}

export class UpdateVariantDto {
  @IsOptional() @IsInt() @Min(0) priceVnd?: number;
  @IsOptional() @IsInt() @Min(0) compareAtVnd?: number | null;
  @IsOptional() @IsEnum(PurchaseMode) purchaseMode?: PurchaseMode;
  @IsOptional() @IsBoolean() isActive?: boolean;
  /** Physical units on hand. */
  @IsOptional() @IsInt() @Min(0) stock?: number;
}
