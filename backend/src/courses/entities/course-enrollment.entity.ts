import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CourseSession } from "./course-session.entity";

@Entity("course_enrollments")
export class CourseEnrollment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  sessionId!: string;

  @Column({ type: "varchar", nullable: true })
  orderId!: string | null;

  /** Account that reserved the seat, when signed in. */
  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @Column()
  contactName!: string;

  @Column()
  contactPhone!: string;

  @Column({ type: "varchar", nullable: true })
  contactEmail!: string | null;

  @Column({ type: "int" })
  quantity!: number;

  /** School or organisation (workshops). */
  @Column({ type: "varchar", length: 200, nullable: true })
  organization!: string | null;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({
    type: "enum",
    enum: ["reserved", "confirmed", "cancelled"],
    default: "reserved",
  })
  status!: "reserved" | "confirmed" | "cancelled";

  @ManyToOne(() => CourseSession, (session) => session.enrollments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "sessionId" })
  session!: CourseSession;

  @CreateDateColumn()
  createdAt!: Date;
}
