import { MigrationInterface, QueryRunner } from "typeorm";

/** Workshops: a Zalo group per course, and school/group details on enrollments. */
export class WorkshopFields1795500000000 implements MigrationInterface {
    name = 'WorkshopFields1795500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "courses" ADD "zaloGroupUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "course_enrollments" ADD "organization" character varying(200)`);
        await queryRunner.query(`ALTER TABLE "course_enrollments" ADD "note" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_enrollments" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "course_enrollments" DROP COLUMN "organization"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "zaloGroupUrl"`);
    }
}
