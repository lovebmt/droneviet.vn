import { MigrationInterface, QueryRunner } from "typeorm";

export class ContentV21795421727838 implements MigrationInterface {
    name = 'ContentV21795421727838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ADD "tags" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "levels" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "attachments" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "relatedProductSlugs" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "kind" character varying NOT NULL DEFAULT 'guide'`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "readingMinutes" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "readingMinutes"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "kind"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "relatedProductSlugs"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "attachments"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "levels"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tags"`);
    }

}
