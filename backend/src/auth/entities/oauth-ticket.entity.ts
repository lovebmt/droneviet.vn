import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type OauthProvider = "google" | "zalo";

/**
 * Single-use, short-lived OAuth bookkeeping (replaces we3d's Redis keys; serverless has no memory):
 * - kind "state": issued when a sign-in starts; holds the Zalo PKCE verifier. Its existence is the CSRF check.
 * - kind "exchange": issued after the provider callback; the web app trades it for a session once.
 */
@Entity("oauth_tickets")
export class OauthTicket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 128 })
  token!: string;

  @Column({ type: "varchar", length: 16 })
  kind!: "state" | "exchange";

  @Column({ type: "varchar", length: 16 })
  provider!: OauthProvider;

  @Column({ type: "varchar", length: 128, nullable: true })
  codeVerifier!: string | null;

  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
