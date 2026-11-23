import { MigrationInterface, QueryRunner } from "typeorm";

export class CatalogV21795421260457 implements MigrationInterface {
    name = 'CatalogV21795421260457'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "combo_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "comboId" uuid NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL, "note" character varying, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_f633e0564e3422d489c5cebe2e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "combo_size_tiers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "comboId" uuid NOT NULL, "students" integer NOT NULL, "priceVnd" bigint NOT NULL, "label" character varying, CONSTRAINT "PK_e18a840136be51ce73a267e96ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" ADD "nameEn" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "summaryEn" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "levels" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "gallery" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "specs" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "inTheBox" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "faq" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "compatibleWith" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "brochureUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "seoTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "seoDescription" text`);
        await queryRunner.query(`ALTER TABLE "products" ADD "badge" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ADD "sortOrder" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "featured" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."products_kind_enum" RENAME TO "products_kind_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."products_kind_enum" AS ENUM('accessory', 'bundle', 'combo', 'course', 'drone', 'education_kit', 'part')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "kind" TYPE "public"."products_kind_enum" USING "kind"::"text"::"public"."products_kind_enum"`);
        await queryRunner.query(`DROP TYPE "public"."products_kind_enum_old"`);
        await queryRunner.query(`ALTER TABLE "combo_items" ADD CONSTRAINT "FK_3b4ce71c9b99bd8b26ce0618408" FOREIGN KEY ("comboId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "combo_items" ADD CONSTRAINT "FK_03c506dab0f05ce63ae9aec1d1a" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "combo_size_tiers" ADD CONSTRAINT "FK_acc76c7e4848c2c6768d18934dc" FOREIGN KEY ("comboId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "combo_size_tiers" DROP CONSTRAINT "FK_acc76c7e4848c2c6768d18934dc"`);
        await queryRunner.query(`ALTER TABLE "combo_items" DROP CONSTRAINT "FK_03c506dab0f05ce63ae9aec1d1a"`);
        await queryRunner.query(`ALTER TABLE "combo_items" DROP CONSTRAINT "FK_3b4ce71c9b99bd8b26ce0618408"`);
        await queryRunner.query(`CREATE TYPE "public"."products_kind_enum_old" AS ENUM('accessory', 'bundle', 'course', 'drone', 'education_kit')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "kind" TYPE "public"."products_kind_enum_old" USING "kind"::"text"::"public"."products_kind_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."products_kind_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."products_kind_enum_old" RENAME TO "products_kind_enum"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "featured"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sortOrder"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "badge"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "seoDescription"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "seoTitle"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "brochureUrl"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "compatibleWith"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "faq"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "inTheBox"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "specs"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "gallery"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "levels"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "summaryEn"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "nameEn"`);
        await queryRunner.query(`DROP TABLE "combo_size_tiers"`);
        await queryRunner.query(`DROP TABLE "combo_items"`);
    }

}
