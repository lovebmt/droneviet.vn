import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

class ComboItemDto {
  @IsString() productSlug!: string;
  @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsString() note?: string | null;
}

export class ReplaceComboItemsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => ComboItemDto) items!: ComboItemDto[];
}

class SizeTierDto {
  @IsInt() @Min(1) students!: number;
  @IsInt() @Min(1) priceVnd!: number;
  @IsOptional() @IsString() label?: string | null;
}

export class ReplaceSizeTiersDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SizeTierDto) tiers!: SizeTierDto[];
}
