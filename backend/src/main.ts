import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { configureApp } from "./app-setup";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  if (process.env.NODE_ENV !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Drone Viet Commerce API")
      .setVersion("1.0")
      .build();
    SwaggerModule.setup("api", app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.listen(Number(process.env.PORT ?? 4000));
}

void bootstrap();
