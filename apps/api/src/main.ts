import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ensurePersistenceMode } from '@/externals/database/persistence-mode';

async function bootstrap(): Promise<void> {
  const mode = await ensurePersistenceMode();
  if (mode === 'memory') {
    process.env.DATABASE_URL ??=
      'postgresql://memory:memory@127.0.0.1:5432/memory?schema=public';
  }

  const { AppModule } = await import('./externals/nest/module');
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
  await app.listen(port, '0.0.0.0');
  Logger.log(`API em :${port} (PERSISTENCE_MODE=${mode})`, 'Bootstrap');
}

void bootstrap();
