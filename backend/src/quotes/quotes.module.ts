import { AuthModule } from "../auth/auth.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuoteRequest } from "./entities/quote-request.entity";
import { AdminQuotesController } from "./admin-quotes.controller";
import { QuotesController } from "./quotes.controller";
import { QuotesService } from "./quotes.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([QuoteRequest])],
  controllers: [QuotesController, AdminQuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
