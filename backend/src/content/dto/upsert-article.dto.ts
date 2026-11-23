import { Type } from "class-transformer";
import { IsArray, IsIn, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

class AttachmentDto {
  @IsString() url!: string;
  @IsString() label!: string;
}

/** Body of PUT /admin/content/articles/:slug (spec §9.4). */
export class UpsertArticleDto {
  @IsString() @MinLength(2) title!: string;
  @IsString() @MinLength(1) bodyMarkdown!: string;
  @IsOptional() @IsString() summary?: string | null;
  @IsOptional() @IsString() coverImageUrl?: string | null;
  @IsOptional() @IsString() seoTitle?: string | null;
  @IsOptional() @IsString() seoDescription?: string | null;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @IsIn(["tieu-hoc", "thcs", "thpt", "dai-hoc", "quoc-te"], { each: true }) levels?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttachmentDto) attachments?: AttachmentDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) relatedProductSlugs?: string[];
  @IsOptional() @IsIn(["guide", "research", "news"]) kind?: string;
}
