import { describe, expect, it } from "vitest";
import { ProductVariant } from "../catalog/entities/product-variant.entity";
import { Product } from "../catalog/entities/product.entity";
import { Article } from "../content/entities/article.entity";
import { ContentRevision } from "../content/entities/content-revision.entity";
import { User } from "../auth/entities/user.entity";
import { OrderLine } from "../orders/entities/order-line.entity";
import { Order } from "../orders/entities/order.entity";
import { QuoteRequest } from "../quotes/entities/quote-request.entity";
import { InventoryItem } from "../inventory/entities/inventory-item.entity";
import { PaymentAttempt } from "../payments/entities/payment-attempt.entity";
import { ProductContent } from "../content/entities/product-content.entity";
import { Course } from "../courses/entities/course.entity";
import { CourseSession } from "../courses/entities/course-session.entity";
import { CourseEnrollment } from "../courses/entities/course-enrollment.entity";
import { AuditEvent } from "../audit/entities/audit-event.entity";
import { PromoCode } from "../promotions/entities/promo-code.entity";
import { createDatabaseOptions } from "./data-source";

describe("createDatabaseOptions", () => {
  it("uses postgres from discrete vars and never synchronizes schema at runtime", () => {
    const options = createDatabaseOptions({
      DATABASE_HOST: "localhost",
      DATABASE_NAME: "droneviet",
      DATABASE_PASSWORD: "droneviet",
      DATABASE_USER: "droneviet",
    });

    expect(options).toMatchObject({
      database: "droneviet",
      host: "localhost",
      port: 5432,
      synchronize: false,
      type: "postgres",
      username: "droneviet",
    });
    expect(options.entities).toEqual(
      expect.arrayContaining([
        Product,
        ProductVariant,
        Article,
        ContentRevision,
        User,
        Order,
        OrderLine,
        QuoteRequest,
        InventoryItem,
        PaymentAttempt,
        ProductContent,
        Course,
        CourseSession,
        CourseEnrollment,
        AuditEvent,
        PromoCode,
      ]),
    );
    expect(options.migrations).toHaveLength(4);
  });

  it("uses DATABASE_URL with TLS when sslmode=require", () => {
    const url = "postgres://u:p@ep-x.neon.tech/db?sslmode=require";
    const options = createDatabaseOptions({ DATABASE_URL: url });

    expect(options).toMatchObject({ type: "postgres", url });
    // Neon serves publicly trusted certificates: verify them, never disable verification.
    expect((options as { ssl?: unknown }).ssl).toBe(true);
  });

  it("uses a local DATABASE_URL without TLS", () => {
    const options = createDatabaseOptions({
      DATABASE_URL: "postgres://droneviet:droneviet@localhost:5433/droneviet",
    });

    expect((options as { ssl?: unknown }).ssl).toBeFalsy();
  });
});
