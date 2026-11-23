import { BadRequestException, Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContentTokenGuard } from "../auth/content-token.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { MAX_MEDIA_BYTES, MediaService } from "./media.service";

@Controller("admin/media")
// Admin roles, or the R&D publishing skill with CONTENT_PUBLISH_TOKEN.
@UseGuards(ContentTokenGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CATALOG_MANAGER)
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  /** Multer maps files over the limit to 413 Payload Too Large. */
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_MEDIA_BYTES, files: 1 } }))
  upload(
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
    @Body("alt") alt?: string,
    @Body("source") source?: string,
  ) {
    if (!file) {
      throw new BadRequestException("Attach the file in the 'file' field");
    }
    return this.media.upload(file, alt, source);
  }
}
