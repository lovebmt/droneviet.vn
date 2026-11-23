import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PromoType {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
}

@Entity("promo_codes")
export class PromoCode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ type: "enum", enum: PromoType })
  type!: PromoType;

  @Column({ type: "int" })
  value!: number;

  @Column({ type: "bigint", nullable: true })
  minimumOrderVnd!: number | null;

  @Column({ type: "bigint", nullable: true })
  maxDiscountVnd!: number | null;

  @Column({ type: "int", nullable: true })
  usageLimit!: number | null;

  @Column({ type: "int", default: 0 })
  usageCount!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "timestamp", nullable: true })
  startsAt!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  endsAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
