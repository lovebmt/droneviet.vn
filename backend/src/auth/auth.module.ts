import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ContentTokenGuard } from "./content-token.guard";
import { OauthTicket } from "./entities/oauth-ticket.entity";
import { User } from "./entities/user.entity";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { resolveJwtSecret } from "./jwt-config";
import { OauthController } from "./oauth.controller";
import { OauthService } from "./oauth.service";
import { RolesGuard } from "./roles.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OauthTicket]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret({
          JWT_ACCESS_SECRET: config.get<string>("JWT_ACCESS_SECRET"),
          NODE_ENV: config.get<string>("NODE_ENV"),
        }),
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  controllers: [AuthController, OauthController],
  providers: [AuthService, OauthService, JwtAuthGuard, RolesGuard, ContentTokenGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule, RolesGuard, ContentTokenGuard],
})
export class AuthModule {}
