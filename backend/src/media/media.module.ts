import { Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { AdminMediaController } from "./admin-media.controller";
import { MediaController } from "./media.controller";
import { Media } from "./media.entity";
import { MEDIA_STORAGE, MemoryMediaStorage, R2MediaStorage } from "./media-storage";
import { MediaService } from "./media.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Media])],
  controllers: [MediaController, AdminMediaController],
  providers: [
    MediaService,
    {
      provide: MEDIA_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const accountId = config.get<string>("R2_ACCOUNT_ID");
        const keyId = config.get<string>("R2_ACCESS_KEY_ID");
        const secret = config.get<string>("R2_SECRET_ACCESS_KEY");
        if (accountId && keyId && secret) {
          return new R2MediaStorage(accountId, keyId, secret, config.get<string>("R2_BUCKET") ?? "droneviet-media");
        }
        if (config.get<string>("NODE_ENV") === "production") {
          throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required in production");
        }
        new Logger("MediaModule").warn("R2 credentials not set: using in-memory media storage");
        return new MemoryMediaStorage();
      },
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
