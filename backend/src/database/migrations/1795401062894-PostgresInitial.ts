import { MigrationInterface, QueryRunner } from "typeorm";

export class PostgresInitial1795401062894 implements MigrationInterface {
    name = 'PostgresInitial1795401062894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_kind_enum" AS ENUM('accessory', 'bundle', 'course', 'drone', 'education_kit')`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('archived', 'draft', 'published')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "summary" text NOT NULL, "kind" "public"."products_kind_enum" NOT NULL, "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "coverImageUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productVariantId" uuid NOT NULL, "onHand" integer NOT NULL DEFAULT '0', "reserved" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8fa4cdd8e98fde93d4f14025417" UNIQUE ("productVariantId"), CONSTRAINT "REL_8fa4cdd8e98fde93d4f1402541" UNIQUE ("productVariantId"), CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."product_variants_purchasemode_enum" AS ENUM('checkout', 'preorder', 'quote_only')`);
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "sku" character varying NOT NULL, "title" character varying NOT NULL, "priceVnd" bigint NOT NULL, "compareAtVnd" bigint, "purchaseMode" "public"."product_variants_purchasemode_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_46f236f21640f9da218a063a866" UNIQUE ("sku"), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "content_revisions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "articleId" uuid NOT NULL, "revisionNumber" integer NOT NULL, "bodyMarkdown" text NOT NULL, "renderedHtml" text NOT NULL, "tableOfContents" json NOT NULL, "metadata" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_content_revisions_article_revision" UNIQUE ("articleId", "revisionNumber"), CONSTRAINT "PK_750b063aa2aad282d6a5fd2db2a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."articles_status_enum" AS ENUM('draft', 'published', 'scheduled')`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "locale" character varying NOT NULL DEFAULT 'vi', "title" character varying NOT NULL, "summary" text, "bodyMarkdown" text NOT NULL, "renderedHtml" text, "tableOfContents" json, "coverImageUrl" character varying, "seoTitle" character varying, "seoDescription" text, "status" "public"."articles_status_enum" NOT NULL DEFAULT 'draft', "revisionNumber" integer NOT NULL DEFAULT '0', "publishedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "roles" json NOT NULL, "displayName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payment_attempts_provider_enum" AS ENUM('payos', 'vnpay')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_attempts_status_enum" AS ENUM('failed', 'paid', 'pending')`);
        await queryRunner.query(`CREATE TABLE "payment_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "provider" "public"."payment_attempts_provider_enum" NOT NULL, "providerOrderCode" bigint NOT NULL, "status" "public"."payment_attempts_status_enum" NOT NULL DEFAULT 'pending', "amountVnd" bigint NOT NULL, "checkoutUrl" text, "providerReference" character varying, "paidAt" TIMESTAMP, "refundReference" character varying, "refundedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a0d8a67c07a0fef98dfd20214e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('cancelled', 'delivered', 'packing', 'paid', 'payment_failed', 'pending_payment', 'refund_requested', 'refunded', 'shipped')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_paymentmethod_enum" AS ENUM('bank_transfer', 'cod', 'payos')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderNumber" character varying NOT NULL, "paymentOrderCode" BIGSERIAL NOT NULL, "status" "public"."orders_status_enum" NOT NULL, "paymentMethod" "public"."orders_paymentmethod_enum" NOT NULL, "totalVnd" bigint NOT NULL, "subtotalVnd" bigint NOT NULL, "discountVnd" bigint NOT NULL DEFAULT '0', "promotionCode" character varying, "contactName" character varying NOT NULL, "contactPhone" character varying NOT NULL, "contactEmail" character varying, "shippingAddress" text, "reservationExpiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_59b0c3b34ea0fa5562342f24143" UNIQUE ("orderNumber"), CONSTRAINT "UQ_898a931dfb73a87693b3c51e125" UNIQUE ("paymentOrderCode"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "productVariantId" character varying NOT NULL, "courseSessionId" character varying, "sku" character varying NOT NULL, "title" character varying NOT NULL, "unitPriceVnd" bigint NOT NULL, "quantity" integer NOT NULL, "reservesInventory" boolean NOT NULL DEFAULT false, "subtotalVnd" bigint NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_627dcd7f1d707de4df241b2da6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."quote_requests_status_enum" AS ENUM('converted', 'lost', 'new', 'qualified', 'sent')`);
        await queryRunner.query(`CREATE TABLE "quote_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization" character varying NOT NULL, "contactName" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying, "budgetVnd" bigint, "quantity" integer NOT NULL, "requirements" text, "status" "public"."quote_requests_status_enum" NOT NULL DEFAULT 'new', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c05f72de8be0ec6b0985a851558" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_content" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "locale" character varying(16) NOT NULL, "bodyMarkdown" text NOT NULL, "renderedHtml" text NOT NULL, "tableOfContents" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_product_content_locale" UNIQUE ("productId", "locale"), CONSTRAINT "PK_2bf2e348130d697f3ee3aa4e94e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."course_enrollments_status_enum" AS ENUM('reserved', 'confirmed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "course_enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL, "orderId" character varying, "contactName" character varying NOT NULL, "contactPhone" character varying NOT NULL, "contactEmail" character varying, "quantity" integer NOT NULL, "status" "public"."course_enrollments_status_enum" NOT NULL DEFAULT 'reserved', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_609f6e4f0fc9a6149a35211b380" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."course_sessions_status_enum" AS ENUM('closed', 'open')`);
        await queryRunner.query(`CREATE TABLE "course_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" uuid NOT NULL, "startsAt" TIMESTAMP NOT NULL, "capacity" integer NOT NULL, "reservedSeats" integer NOT NULL DEFAULT '0', "status" "public"."course_sessions_status_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5892d51884be5cf1399c00088d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."courses_purchasemode_enum" AS ENUM('checkout', 'quote_only')`);
        await queryRunner.query(`CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "productVariantId" character varying NOT NULL, "locale" character varying(16) NOT NULL, "title" character varying NOT NULL, "summary" text NOT NULL, "purchaseMode" "public"."courses_purchasemode_enum" NOT NULL, "tuitionVnd" bigint, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a3bb2d01cfa0f95bc5e034e1b7a" UNIQUE ("slug"), CONSTRAINT "UQ_a6fb3741cc6bd4e06685ee0ae16" UNIQUE ("productVariantId"), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actorId" character varying, "action" character varying NOT NULL, "aggregateType" character varying NOT NULL, "aggregateId" character varying NOT NULL, "previousState" json, "nextState" json NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."promo_codes_type_enum" AS ENUM('fixed', 'percentage')`);
        await queryRunner.query(`CREATE TABLE "promo_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "type" "public"."promo_codes_type_enum" NOT NULL, "value" integer NOT NULL, "minimumOrderVnd" bigint, "maxDiscountVnd" bigint, "usageLimit" integer, "usageCount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "startsAt" TIMESTAMP, "endsAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2f096c406a9d9d5b8ce204190c3" UNIQUE ("code"), CONSTRAINT "PK_c7b4f01710fda5afa056a2b4a35" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_8fa4cdd8e98fde93d4f14025417" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_f515690c571a03400a9876600b5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_revisions" ADD CONSTRAINT "FK_0c9157beca1d2b40aecb190fd76" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_attempts" ADD CONSTRAINT "FK_c7282317dd585c3668f10ac2ec1" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_lines" ADD CONSTRAINT "FK_307e8091afc1a959953d06d5ad1" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_content" ADD CONSTRAINT "FK_ec34a22f278ed238bb550f05622" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_enrollments" ADD CONSTRAINT "FK_0b6ca6660003a0e9528ca952250" FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_sessions" ADD CONSTRAINT "FK_b545f86c4f5d8929e124f15e961" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course_sessions" DROP CONSTRAINT "FK_b545f86c4f5d8929e124f15e961"`);
        await queryRunner.query(`ALTER TABLE "course_enrollments" DROP CONSTRAINT "FK_0b6ca6660003a0e9528ca952250"`);
        await queryRunner.query(`ALTER TABLE "product_content" DROP CONSTRAINT "FK_ec34a22f278ed238bb550f05622"`);
        await queryRunner.query(`ALTER TABLE "order_lines" DROP CONSTRAINT "FK_307e8091afc1a959953d06d5ad1"`);
        await queryRunner.query(`ALTER TABLE "payment_attempts" DROP CONSTRAINT "FK_c7282317dd585c3668f10ac2ec1"`);
        await queryRunner.query(`ALTER TABLE "content_revisions" DROP CONSTRAINT "FK_0c9157beca1d2b40aecb190fd76"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_f515690c571a03400a9876600b5"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT "FK_8fa4cdd8e98fde93d4f14025417"`);
        await queryRunner.query(`DROP TABLE "promo_codes"`);
        await queryRunner.query(`DROP TYPE "public"."promo_codes_type_enum"`);
        await queryRunner.query(`DROP TABLE "audit_events"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TYPE "public"."courses_purchasemode_enum"`);
        await queryRunner.query(`DROP TABLE "course_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."course_sessions_status_enum"`);
        await queryRunner.query(`DROP TABLE "course_enrollments"`);
        await queryRunner.query(`DROP TYPE "public"."course_enrollments_status_enum"`);
        await queryRunner.query(`DROP TABLE "product_content"`);
        await queryRunner.query(`DROP TABLE "quote_requests"`);
        await queryRunner.query(`DROP TYPE "public"."quote_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_lines"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_paymentmethod_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "payment_attempts"`);
        await queryRunner.query(`DROP TYPE "public"."payment_attempts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_attempts_provider_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TYPE "public"."articles_status_enum"`);
        await queryRunner.query(`DROP TABLE "content_revisions"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
        await queryRunner.query(`DROP TYPE "public"."product_variants_purchasemode_enum"`);
        await queryRunner.query(`DROP TABLE "inventory_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."products_kind_enum"`);
    }

}
