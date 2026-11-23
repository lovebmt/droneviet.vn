import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomBytes } from "node:crypto";
import { DataSource } from "typeorm";

/** Postgres URL for integration specs; when unset those specs are skipped. */
export const integrationDatabaseUrl = process.env.TEST_DATABASE_URL;

export interface IntegrationApp {
  app: INestApplication;
  baseUrl: string;
  dataSource: DataSource;
  close(): Promise<void>;
}

/** Boots the whole API against TEST_DATABASE_URL with migrations applied, listening on a random port. */
export async function bootIntegrationApp(extraEnv: Record<string, string> = {}): Promise<IntegrationApp> {
  process.env.DATABASE_URL = integrationDatabaseUrl;
  process.env.JWT_ACCESS_SECRET ??= "integration-access";
  process.env.JWT_REFRESH_SECRET ??= "integration-refresh";
  Object.assign(process.env, extraEnv);

  const { AppModule } = await import("../app.module.js");
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  await app.listen(0);
  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();

  return { app, baseUrl: await app.getUrl(), dataSource, close: () => app.close() };
}

/** Unique suffix so parallel or repeated runs never collide on unique slugs. */
export function uniqueSuffix(): string {
  return randomBytes(4).toString("hex");
}
