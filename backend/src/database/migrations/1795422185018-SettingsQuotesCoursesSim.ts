import { MigrationInterface, QueryRunner } from "typeorm";

export class SettingsQuotesCoursesSim1795422185018 implements MigrationInterface {
    name = 'SettingsQuotesCoursesSim1795422185018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "site_settings" ("key" character varying NOT NULL, "value" json, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e71167433328a5afb90dda43da0" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "sim_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "mission" character varying(40) NOT NULL, "score" integer NOT NULL, "stars" integer NOT NULL, "timeMs" integer NOT NULL, "crashes" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_66eb762a457f9c0df2f2ea5c34a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_497ad818a83a0db503037a03f5" ON "sim_results" ("userId", "mission") `);
        await queryRunner.query(`ALTER TABLE "quote_requests" ADD "productSlug" character varying`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ADD "students" integer`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ADD "organizationType" character varying`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "level" character varying NOT NULL DEFAULT 'co-ban'`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "format" character varying NOT NULL DEFAULT 'truc-tiep'`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "durationHours" integer`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "descriptionMarkdown" text`);
        await queryRunner.query(`ALTER TABLE "courses" ADD "certificateTrack" character varying`);
        await queryRunner.query(`ALTER TABLE "sim_results" ADD CONSTRAINT "FK_2f9fe2b98976db8fd92bc961837" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sim_results" DROP CONSTRAINT "FK_2f9fe2b98976db8fd92bc961837"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "certificateTrack"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "descriptionMarkdown"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "durationHours"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "format"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "level"`);
        await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "organizationType"`);
        await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "students"`);
        await queryRunner.query(`ALTER TABLE "quote_requests" DROP COLUMN "productSlug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_497ad818a83a0db503037a03f5"`);
        await queryRunner.query(`DROP TABLE "sim_results"`);
        await queryRunner.query(`DROP TABLE "site_settings"`);
    }

}
