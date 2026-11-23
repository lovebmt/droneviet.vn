import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { OrdersUser1795421997305 } from "./migrations/1795421997305-OrdersUser";
import { ContentV21795421727838 } from "./migrations/1795421727838-ContentV2";
import { Media1795421508316 } from "./migrations/1795421508316-Media";
import { CatalogV21795421260457 } from "./migrations/1795421260457-CatalogV2";
import { PostgresInitial1795401062894 } from "./migrations/1795401062894-PostgresInitial";
import { OauthSignIn1795405151810 } from "./migrations/1795405151810-OauthSignIn";
import { ComboItem } from "../catalog/entities/combo-item.entity";
import { Media } from "../media/media.entity";
import { ComboSizeTier } from "../catalog/entities/combo-size-tier.entity";
import { ProductVariant } from "../catalog/entities/product-variant.entity";
import { Product } from "../catalog/entities/product.entity";
import { Article } from "../content/entities/article.entity";
import { ContentRevision } from "../content/entities/content-revision.entity";
import { OauthTicket } from "../auth/entities/oauth-ticket.entity";
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

export function createDatabaseOptions(
  environment: NodeJS.ProcessEnv,
): DataSourceOptions {
  const url = environment.DATABASE_URL;
  const connection = url
    ? {
        url,
        ssl: url.includes("sslmode=require")
          ? true
          : false,
      }
    : {
        host: environment.DATABASE_HOST ?? "localhost",
        port: Number(environment.DATABASE_PORT ?? 5432),
        username: environment.DATABASE_USER ?? "droneviet",
        password: environment.DATABASE_PASSWORD ?? "droneviet",
        database: environment.DATABASE_NAME ?? "droneviet",
      };

  return {
    type: "postgres",
    ...connection,
    entities: [
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
      OauthTicket,
      ComboItem,
      ComboSizeTier,
      Media,
    ],
    migrations: [PostgresInitial1795401062894, OauthSignIn1795405151810, CatalogV21795421260457, Media1795421508316, ContentV21795421727838, OrdersUser1795421997305],
    synchronize: false,
  };
}

export const appDataSource = new DataSource(createDatabaseOptions(process.env));
