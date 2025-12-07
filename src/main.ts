import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT;

  await app.listen(port, '0.0.0.0');

  const appName = process.env.APP_NAME;
  const appDesc = process.env.APP_DESCRIPTION;
  
  console.log(`📧 ${appName} is running on: http://0.0.0.0:${port}`);
  console.log(`ℹ️  Description: ${appDesc}`);
}

bootstrap();
