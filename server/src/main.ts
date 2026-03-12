import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { ensureDatabaseExists } from './infrastructure/database/bootstrap/ensure-database';
import { ensureCanonicalSchema } from './infrastructure/database/bootstrap/initialize-schema';
import { getDatabaseRuntimeConfig } from './infrastructure/database/config/database-env';
import { runInitialSeed } from './infrastructure/database/seeds/database-seeder';

async function bootstrap() {
  await ensureDatabaseExists();

  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const databaseConfig = getDatabaseRuntimeConfig();

  await ensureCanonicalSchema(dataSource);

  if (databaseConfig.autoSeed) {
    await runInitialSeed(dataSource);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
