import { MigrationInterface, QueryRunner } from "typeorm";

export class OrdersUser1795421997305 implements MigrationInterface {
    name = 'OrdersUser1795421997305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "course_enrollments" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`);
        await queryRunner.query(`ALTER TABLE "course_enrollments" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "userId"`);
    }

}
