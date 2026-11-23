import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Product } from "../../catalog/entities/product.entity";

@Entity("product_content")
@Unique("UQ_product_content_locale", ["productId", "locale"])
export class ProductContent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  productId!: string;

  @Column({ length: 16 })
  locale!: string;

  @Column({ type: "text" })
  bodyMarkdown!: string;

  @Column({ type: "text" })
  renderedHtml!: string;

  @Column({ type: "json" })
  tableOfContents!: Array<{ depth: number; id: string; text: string }>;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product!: Product;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
