import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { Media } from "./media.entity";
import { MEDIA_STORAGE, type MediaStorage } from "./media-storage";
import { EXTENSION_BY_MIME, isUnsafeSvg, sniffMime } from "./sniff-mime";

export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

export interface UploadedMedia {
  id: string;
  url: string;
  mime: string;
  bytes: number;
}

/** "Ảnh Lớp Học.webp" -> "anh-lop-hoc". */
function slugifyName(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "file"
  );
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private readonly media: Repository<Media>,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    private readonly config: ConfigService,
  ) {}

  async upload(file: { buffer: Buffer; originalname: string }, alt?: string, source?: string): Promise<UploadedMedia> {
    const mime = sniffMime(file.buffer);
    if (!mime) {
      throw new BadRequestException("Only WebP, AVIF, PNG, JPEG, SVG images and PDF files are accepted");
    }
    if (mime === "image/svg+xml" && isUnsafeSvg(file.buffer)) {
      throw new BadRequestException("SVG files must not contain scripts or event handlers");
    }

    const id = randomUUID();
    const now = new Date();
    const filename = `${slugifyName(file.originalname)}.${EXTENSION_BY_MIME[mime]}`;
    const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}/${filename}`;

    await this.storage.put(key, file.buffer, mime);
    await this.media.save(
      this.media.create({ id, key, filename, mime, bytes: file.buffer.length, width: null, height: null, alt: alt ?? null, source: source ?? null }),
    );

    return { id, url: this.publicUrl(id, filename), mime, bytes: file.buffer.length };
  }

  async read(id: string): Promise<{ body: Buffer; contentType: string }> {
    const media = /^[0-9a-f-]{36}$/i.test(id) ? await this.media.findOneBy({ id }) : null;
    const object = media ? await this.storage.get(media.key) : null;
    if (!media || !object) {
      throw new NotFoundException("Media not found");
    }
    return { body: object.body, contentType: media.mime };
  }

  private publicUrl(id: string, filename: string): string {
    const base = (this.config.get<string>("PUBLIC_API_URL") ?? "http://localhost:4000").replace(/\/$/, "");
    return `${base}/media/${id}/${filename}`;
  }
}
