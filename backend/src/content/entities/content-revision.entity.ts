import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Article } from "./article.entity";

@Entity("content_revisions")
@Unique("UQ_content_revisions_article_revision", ["articleId", "revisionNumber"])
export class ContentRevision {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  articleId!: string;

  @Column({ type: "int" })
  revisionNumber!: number;

  @Column({ type: "text" })
  bodyMarkdown!: string;

  @Column({ type: "text" })
  renderedHtml!: string;

  @Column({ type: "json" })
  tableOfContents!: Array<{ depth: number; id: string; text: string }>;

  @Column({ type: "json" })
  metadata!: {
    seoDescription: string | null;
    seoTitle: string | null;
    summary: string | null;
    title: string;
  };

  @ManyToOne(() => Article, (article) => article.revisions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "articleId" })
  article!: Article;

  @CreateDateColumn()
  createdAt!: Date;
}
