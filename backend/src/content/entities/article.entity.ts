import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ContentRevision } from "./content-revision.entity";

export enum ContentStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  SCHEDULED = "scheduled",
}

@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ default: "vi" })
  locale!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  summary!: string | null;

  @Column({ type: "text" })
  bodyMarkdown!: string;

  @Column({ type: "text", nullable: true })
  renderedHtml!: string | null;

  @Column({ type: "json", nullable: true })
  tableOfContents!: Array<{ depth: number; id: string; text: string }> | null;

  @Column({ type: "varchar", nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: "varchar", nullable: true })
  seoTitle!: string | null;

  @Column({ type: "text", nullable: true })
  seoDescription!: string | null;

  @Column({ type: "json", default: () => "'[]'" })
  tags!: string[];

  @Column({ type: "json", default: () => "'[]'" })
  levels!: string[];

  @Column({ type: "json", default: () => "'[]'" })
  attachments!: Array<{ url: string; label: string }>;

  @Column({ type: "json", default: () => "'[]'" })
  relatedProductSlugs!: string[];

  /** guide | research | news (spec §9.4). */
  @Column({ type: "varchar", default: "guide" })
  kind!: string;

  @Column({ type: "int", nullable: true })
  readingMinutes!: number | null;

  @Column({ type: "enum", enum: ContentStatus, default: ContentStatus.DRAFT })
  status!: ContentStatus;

  @Column({ type: "int", default: 0 })
  revisionNumber!: number;

  @Column({ type: "timestamp", nullable: true })
  publishedAt!: Date | null;

  @OneToMany(() => ContentRevision, (revision) => revision.article)
  revisions!: ContentRevision[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
