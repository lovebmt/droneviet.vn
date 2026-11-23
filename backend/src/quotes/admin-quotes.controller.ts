import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Query, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsEnum } from "class-validator";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/entities/user.entity";
import { QuoteRequest, QuoteStatus } from "./entities/quote-request.entity";

class UpdateQuoteDto {
  @IsEnum(QuoteStatus) status!: QuoteStatus;
}

@Controller("admin/quotes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SALES)
export class AdminQuotesController {
  constructor(@InjectRepository(QuoteRequest) private readonly quotes: Repository<QuoteRequest>) {}

  @Get()
  list(@Query("status") status?: string) {
    const where = status && (Object.values(QuoteStatus) as string[]).includes(status) ? { status: status as QuoteStatus } : {};
    return this.quotes.find({ where, order: { createdAt: "DESC" }, take: 500 });
  }

  @Patch(":id")
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateQuoteDto) {
    const quote = await this.quotes.findOneBy({ id });
    if (!quote) throw new NotFoundException("Quote not found");
    quote.status = input.status;
    return this.quotes.save(quote);
  }
}
