import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/** Small key/value settings editable in admin, e.g. contact details (spec §16 Q6). */
@Entity("site_settings")
export class SiteSetting {
  @PrimaryColumn({ type: "varchar" })
  key!: string;

  @Column({ type: "json", nullable: true })
  value!: unknown;

  @UpdateDateColumn()
  updatedAt!: Date;
}
