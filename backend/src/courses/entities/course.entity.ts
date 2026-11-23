import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseSession } from "./course-session.entity";

export enum CoursePurchaseMode {
  CHECKOUT = "checkout",
  QUOTE_ONLY = "quote_only",
}

@Entity("courses")
export class Course {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ unique: true })
  productVariantId!: string;

  @Column({ length: 16 })
  locale!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  summary!: string;

  @Column({ type: "enum", enum: CoursePurchaseMode })
  purchaseMode!: CoursePurchaseMode;

  @Column({ type: "bigint", nullable: true })
  tuitionVnd!: number | null;

  /** co-ban | nang-cao | chung-chi */
  @Column({ type: "varchar", default: "co-ban" })
  level!: string;

  /** truc-tiep | online | ket-hop */
  @Column({ type: "varchar", default: "truc-tiep" })
  format!: string;

  @Column({ type: "int", nullable: true })
  durationHours!: number | null;

  @Column({ type: "text", nullable: true })
  descriptionMarkdown!: string | null;

  /** Certificate path this course belongs to (spec §8.5). */
  @Column({ type: "varchar", nullable: true })
  certificateTrack!: string | null;

  /** Zalo group for this course or workshop, shown on the page and after enrolling. */
  @Column({ type: "varchar", nullable: true })
  zaloGroupUrl!: string | null;

  @OneToMany(() => CourseSession, (session) => session.course)
  sessions!: CourseSession[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
