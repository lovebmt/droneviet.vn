import { Controller, Get, Header, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { MediaService } from "./media.service";

@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** The filename segment is cosmetic (SEO, downloads); the id selects the file. */
  @Get(":id/:filename")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  async serve(@Param("id") id: string, @Res() res: Response) {
    const { body, contentType } = await this.media.read(id);
    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Uploaded SVGs are sanitised, but never let any media file run script on the API origin.
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
    res.send(body);
  }
}
