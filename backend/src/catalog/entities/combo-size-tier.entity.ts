import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { bigintVndTransformer } from "../../common/money/bigint-vnd.transformer";
import { Product } from "./product.entity";

/** Estimated combo price for a class size; no tiers means "Liên hệ báo giá" (spec §16). */
@Entity("combo_size_tiers")
export class ComboSizeTier {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  comboId!: string;

  @Column({ type: "int" })
  students!: number;

  @Column({ type: "bigint", transformer: bigintVndTransformer })
  priceVnd!: number;

  @Column({ type: "varchar", nullable: true })
  label!: string | null;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comboId" })
  combo!: Product;
}
