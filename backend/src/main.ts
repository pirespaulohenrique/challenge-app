import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for frontend
  app.useGlobalPipes(new ValidationPipe());

  // Use PORT env variable if it exists, otherwise default to 3000
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
