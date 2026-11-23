import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/** An uploaded image or PDF stored in R2 (spec §9.3). */
@Entity("media")
export class Media {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  key!: string;

  @Column({ type: "varchar" })
  filename!: string;

  @Column({ type: "varchar" })
  mime!: string;

  @Column({ type: "int" })
  bytes!: number;

  @Column({ type: "int", nullable: true })
  width!: number | null;

  @Column({ type: "int", nullable: true })
  height!: number | null;

  @Column({ type: "varchar", nullable: true })
  alt!: string | null;

  /** Where the image came from / its licence, e.g. "Igor Savin, CC BY-SA 3.0". */
  @Column({ type: "varchar", nullable: true })
  source!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
