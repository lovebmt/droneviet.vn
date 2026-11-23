import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/** Where uploaded bytes live (spec §9.3). */
export interface MediaStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
}

export const MEDIA_STORAGE = Symbol("MEDIA_STORAGE");

/** Cloudflare R2 through its S3-compatible API. */
export class R2MediaStorage implements MediaStorage {
  private readonly client: S3Client;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    private readonly bucket: string,
  ) {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      const object = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const bytes = await object.Body?.transformToByteArray();
      return bytes ? { body: Buffer.from(bytes), contentType: object.ContentType ?? "application/octet-stream" } : null;
    } catch (error) {
      if ((error as { name?: string }).name === "NoSuchKey") {
        return null;
      }
      throw error;
    }
  }
}

/** In-process storage for tests and local development without R2 credentials. */
export class MemoryMediaStorage implements MediaStorage {
  private readonly objects = new Map<string, { body: Buffer; contentType: string }>();

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    this.objects.set(key, { body, contentType });
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    return this.objects.get(key) ?? null;
  }
}
