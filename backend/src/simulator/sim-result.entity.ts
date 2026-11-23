import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../auth/entities/user.entity";

/** One finished simulator mission run (spec §11). */
@Entity("sim_results")
@Index(["userId", "mission"])
export class SimResult {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar", length: 40 })
  mission!: string;

  @Column({ type: "int" })
  score!: number;

  @Column({ type: "int" })
  stars!: number;

  @Column({ type: "int" })
  timeMs!: number;

  @Column({ type: "int" })
  crashes!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
