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

  @Column({ type: "enum", enum: QuoteStatus, default: QuoteStatus.NEW })
  status!: QuoteStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
