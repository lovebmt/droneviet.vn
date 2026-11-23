import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProductVariant } from "./product-variant.entity";

export enum ProductKind {
  ACCESSORY = "accessory",
  BUNDLE = "bundle",
  COMBO = "combo",
  COURSE = "course",
  DRONE = "drone",
  EDUCATION_KIT = "education_kit",
  PART = "part",
}

/** School levels a product targets (spec §9.1). */
export type ProductLevel = "tieu-hoc" | "thcs" | "thpt" | "dai-hoc" | "quoc-te";
export interface ProductImage { url: string; alt: string }
export interface ProductSpecGroup { group: string; items: Array<{ label: string; value: string }> }
export interface ProductFaq { q: string; a: string }

export enum ProductStatus {
  ARCHIVED = "archived",
  DRAFT = "draft",
  PUBLISHED = "published",
}

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  name!: string;

  @Column({ type: "text" })
  summary!: string;

  @Column({ type: "enum", enum: ProductKind })
  kind!: ProductKind;

  @Column({ type: "enum", enum: ProductStatus, default: ProductStatus.DRAFT })
  status!: ProductStatus;

  @Column({ type: "varchar", nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: "varchar", nullable: true })
  nameEn!: string | null;

  @Column({ type: "text", nullable: true })
  summaryEn!: string | null;

  @Column({ type: "json", default: () => "'[]'" })
  levels!: ProductLevel[];

  @Column({ type: "json", default: () => "'[]'" })
  gallery!: ProductImage[];

  @Column({ type: "json", default: () => "'[]'" })
  specs!: ProductSpecGroup[];

  @Column({ type: "json", default: () => "'[]'" })
  inTheBox!: string[];

  @Column({ type: "json", default: () => "'[]'" })
  faq!: ProductFaq[];

  /** Slugs of products this part/accessory fits. */
  @Column({ type: "json", default: () => "'[]'" })
  compatibleWith!: string[];

  @Column({ type: "varchar", nullable: true })
  brochureUrl!: string | null;

  @Column({ type: "varchar", nullable: true })
  seoTitle!: string | null;

  @Column({ type: "text", nullable: true })
  seoDescription!: string | null;

  /** Short label such as "Mới" or "Bán chạy". */
  @Column({ type: "varchar", nullable: true })
  badge!: string | null;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ default: false })
  featured!: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants!: ProductVariant[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
