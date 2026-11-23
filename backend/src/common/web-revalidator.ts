import { Global, Injectable, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Tells the web app to refresh cached pages after catalog or content changes (spec §9.4).
 * Fire-and-forget: never throws, gives up after 3 s, so a slow web never blocks an admin write.
 */
@Injectable()
export class WebRevalidator {
  private readonly logger = new Logger(WebRevalidator.name);

  constructor(private readonly config: ConfigService) {}

  async revalidate(tags: string[]): Promise<void> {
    const url = this.config.get<string>("WEB_REVALIDATE_URL");
    if (!url) {
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": this.config.get<string>("WEB_REVALIDATE_SECRET") ?? "",
        },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(3_000),
      });
      if (!response.ok) {
        this.logger.warn(`revalidate ${tags.join(",")}: HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`revalidate ${tags.join(",")} failed: ${error instanceof Error ? error.message : error}`);
    }
  }
}

@Global()
@Module({ providers: [WebRevalidator], exports: [WebRevalidator] })
export class CommonModule {}
