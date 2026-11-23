import {
  JoinColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrderLine } from "./order-line.entity";
import { OrderStatus } from "../order-workflow";
import { bigintVndTransformer } from "../../common/money/bigint-vnd.transformer";
import { PaymentAttempt } from "../../payments/entities/payment-attempt.entity";

export enum OrderPaymentMethod {
  BANK_TRANSFER = "bank_transfer",
  COD = "cod",
  PAYOS = "payos",
}

import { User } from "../../auth/entities/user.entity";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  orderNumber!: string;

  @Column({
    type: "bigint",
    unique: true,
    generated: "increment",
    transformer: bigintVndTransformer,
  })
  paymentOrderCode!: number;

  @Column({ type: "enum", enum: OrderStatus })
  status!: OrderStatus;

  @Column({ type: "enum", enum: OrderPaymentMethod })
  paymentMethod!: OrderPaymentMethod;

  @Column({ type: "bigint", transformer: bigintVndTransformer })
  totalVnd!: number;

  @Column({ type: "bigint", transformer: bigintVndTransformer })
  subtotalVnd!: number;

  @Column({ type: "bigint", default: 0, transformer: bigintVndTransformer })
  discountVnd!: number;

  @Column({ type: "varchar", nullable: true })
  promotionCode!: string | null;

  @Column()
  contactName!: string;

  @Column()
  contactPhone!: string;

  @Column({ type: "varchar", nullable: true })
  contactEmail!: string | null;

  @Column({ type: "text", nullable: true })
  shippingAddress!: string | null;

  @Column({ type: "timestamp", nullable: true })
  reservationExpiresAt!: Date | null;

  /** Set when the buyer was signed in; guest orders stay null (spec §9.2). */
  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user!: User | null;

  @OneToMany(() => OrderLine, (line) => line.order)
  lines!: OrderLine[];

  @OneToMany(() => PaymentAttempt, (payment) => payment.order)
  payments!: PaymentAttempt[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
