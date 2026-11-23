import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser = require("cookie-parser");

/** Shared by main.ts and integration tests so both run the same middleware. */
export function configureApp(app: INestApplication, env: NodeJS.ProcessEnv = process.env): void {
  const corsOrigin = env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({ credentials: true, origin: corsOrigin?.length ? corsOrigin : false });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }));
}
