import { BadRequestException, Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WebRevalidator } from "../common/web-revalidator";
import { SiteSetting } from "./site-setting.entity";

export interface ContactSettings {
  zalo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  companyName: string | null;
}

export interface PublicSettings {
  contact: ContactSettings;
  announcement: { text: string; href: string | null } | null;
}

/** Placeholder contact until the owner fills it in admin (spec §16). */
export const DEFAULT_CONTACT: ContactSettings = { zalo: "0384070636", phone: null, email: null, address: null, companyName: null };
const CONTACT_FIELDS = Object.keys(DEFAULT_CONTACT) as Array<keyof ContactSettings>;
export const SETTING_KEYS = ["contact", "announcement"] as const;

const asText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, 300) : null;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSetting) private readonly settings: Repository<SiteSetting>,
    @Optional() private readonly revalidator?: WebRevalidator,
  ) {}

  async publicSettings(): Promise<PublicSettings> {
    const rows = new Map((await this.settings.find()).map((row) => [row.key, row.value]));
    const contact = (rows.get("contact") ?? {}) as Partial<ContactSettings>;
    const announcement = rows.get("announcement") as PublicSettings["announcement"] | undefined;
    return {
      contact: { ...DEFAULT_CONTACT, ...contact },
      announcement: announcement?.text ? announcement : null,
    };
  }

  /** contact: partial update of known fields; announcement: {text, href} or null. */
  async update(key: string, value: unknown): Promise<PublicSettings> {
    if (!SETTING_KEYS.includes(key as (typeof SETTING_KEYS)[number])) {
      throw new BadRequestException(`Unknown setting "${key}"`);
    }

    if (key === "contact") {
      const current = ((await this.settings.findOneBy({ key }))?.value ?? {}) as Partial<ContactSettings>;
      const patch = (value ?? {}) as Record<string, unknown>;
      const next = { ...current };
      for (const field of CONTACT_FIELDS) {
        if (field in patch) {
          next[field] = asText(patch[field]);
        }
      }
      await this.settings.save({ key, value: next });
    } else {
      const announcement = value as { text?: unknown; href?: unknown } | null;
      const text = asText(announcement?.text);
      await this.settings.save({ key, value: text ? { text, href: asText(announcement?.href) } : null });
    }

    await this.revalidator?.revalidate(["settings"]);
    return this.publicSettings();
  }
}
