import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { bigintVndTransformer } from "../../common/money/bigint-vnd.transformer";

export enum QuoteStatus {
  CONVERTED = "converted",
  LOST = "lost",
  NEW = "new",
  QUALIFIED = "qualified",
  SENT = "sent",
}

@Entity("quote_requests")
export class QuoteRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  organization!: string;

  @Column()
  contactName!: string;

  @Column()
  phone!: string;

  @Column({ type: "varchar", nullable: true })
  email!: string | null;

  @Column({
    type: "bigint",
    nullable: true,
    transformer: bigintVndTransformer,
  })
  budgetVnd!: number | null;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "text", nullable: true })
  requirements!: string | null;

  /** Combo or product the request is about (spec §8.3). */
  @Column({ type: "varchar", nullable: true })
  productSlug!: string | null;

  @Column({ type: "int", nullable: true })
  students!: number | null;

  /** school | center | university | company | other */
  @Column({ type: "varchar", nullable: true })
  organizationType!: string | null;

  @Column({ type: "enum", enum: QuoteStatus, default: QuoteStatus.NEW })
  status!: QuoteStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
