import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/externals/nest/module';
import { resolvePersistenceMode } from '@/externals/database/persistence-mode';

async function bootstrap(): Promise<void> {
  if (resolvePersistenceMode() === 'memory') {
    process.env.DATABASE_URL ??=
      'postgresql://memory:memory@127.0.0.1:5432/memory?schema=public';
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
