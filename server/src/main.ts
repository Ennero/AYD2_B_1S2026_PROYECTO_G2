import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { ensureDatabaseExists } from './infrastructure/database/bootstrap/ensure-database';
import { ensureCanonicalSchema } from './infrastructure/database/bootstrap/initialize-schema';
import { getDatabaseRuntimeConfig } from './infrastructure/database/config/database-env';
import { runInitialSeed } from './infrastructure/database/seeds/database-seeder';

async function bootstrap() {
  await ensureDatabaseExists();

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  const dataSource = app.get(DataSource);
  const databaseConfig = getDatabaseRuntimeConfig();

  // Enable CORS
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001,http://localhost').split(',');
  app.enableCors({
    origin: corsOrigins.map(o => o.trim()),
    credentials: true,
  });

  await ensureCanonicalSchema(dataSource);

  if (databaseConfig.autoSeed) {
    await runInitialSeed(dataSource);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port} (0.0.0.0)`);
}
bootstrap();
