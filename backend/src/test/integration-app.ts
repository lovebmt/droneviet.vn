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

/** Registers a user through the API and returns a bearer token; `roles` are applied directly in the DB. */
export async function createUserToken(ctx: IntegrationApp, roles: string[] = ["customer"]): Promise<string> {
  const email = `it-${uniqueSuffix()}@example.com`;
  const password = "Integration-Password-123";
  const register = await fetch(`${ctx.baseUrl}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "Integration", email, password }),
  });
  if (!register.ok) {
    throw new Error(`register failed: ${register.status} ${await register.text()}`);
  }
  await ctx.dataSource.query(`UPDATE users SET roles = $1 WHERE email = $2`, [JSON.stringify(roles), email]);
  const login = await fetch(`${ctx.baseUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return ((await login.json()) as { accessToken: string }).accessToken;
}
