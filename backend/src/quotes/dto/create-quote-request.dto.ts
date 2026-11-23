import {
  IsIn,
  IsEmail,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
} from "class-validator";

export class CreateQuoteRequestDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetVnd?: number;

  @IsString()
  contactName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  organization!: string;

  @IsPhoneNumber("VN")
  phone!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  productSlug?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  students?: number;

  @IsOptional()
  @IsIn(["school", "center", "university", "company", "other"])
  organizationType?: string;
}
