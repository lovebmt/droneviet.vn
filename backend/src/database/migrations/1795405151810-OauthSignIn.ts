import { MigrationInterface, QueryRunner } from "typeorm";

export class OauthSignIn1795405151810 implements MigrationInterface {
    name = 'OauthSignIn1795405151810'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "oauth_tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying(128) NOT NULL, "kind" character varying(16) NOT NULL, "provider" character varying(16) NOT NULL, "codeVerifier" character varying(128), "userId" uuid, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4e7d7bf5a8dbd25295c0bedee9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_82a9337410f8dc094bd9bdc5db" ON "oauth_tickets" ("token") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "googleId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "zaloId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_175f25aa436c92e0dd3427e4377" UNIQUE ("zaloId")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "passwordHash" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_175f25aa436c92e0dd3427e4377"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "zaloId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_f382af58ab36057334fb262efd5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "googleId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82a9337410f8dc094bd9bdc5db"`);
        await queryRunner.query(`DROP TABLE "oauth_tickets"`);
    }

}
