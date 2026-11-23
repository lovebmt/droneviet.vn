import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

/** One line of a classroom combo: which product, how many (spec §9.1). */
@Entity("combo_items")
export class ComboItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  comboId!: string;

  @Column({ type: "uuid" })
  productId!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "varchar", nullable: true })
  note!: string | null;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comboId" })
  combo!: Product;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product!: Product;
}
