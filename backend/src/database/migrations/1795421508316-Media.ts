import { MigrationInterface, QueryRunner } from "typeorm";

export class Media1795421508316 implements MigrationInterface {
    name = 'Media1795421508316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "filename" character varying NOT NULL, "mime" character varying NOT NULL, "bytes" integer NOT NULL, "width" integer, "height" integer, "alt" character varying, "source" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b305063b0a030ab458c128078c7" UNIQUE ("key"), CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "media"`);
    }

}
