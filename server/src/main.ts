import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AbortedRequestFilter } from './infrastructure/filters/aborted-request.filter';
import { Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { ensureDatabaseExists } from './infrastructure/database/bootstrap/ensure-database';
import {
  alignIdentitySequences,
  ensureCanonicalSchema,
} from './infrastructure/database/bootstrap/initialize-schema';
import { getDatabaseRuntimeConfig } from './infrastructure/database/config/database-env';
import { runInitialSeed } from './infrastructure/database/seeds/database-seeder';

async function bootstrap() {
  await ensureDatabaseExists();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Graceful shutdown: when ECS sends SIGTERM, finish in-flight requests before exiting.
  // Without this, every active request gets ECONNABORTED when the container is killed.
  app.enableShutdownHooks();

  const rabbitEnabled = ['1', 'true', 'yes', 'on'].includes(
    (process.env.RABBITMQ_ENABLED ?? '').toLowerCase(),
  );
  if (rabbitEnabled) {
    app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672'],
        queue: 'logitrans_queue',
        queueOptions: { durable: true },
        noAck: false,
      },
    });
  }

  app.use(cookieParser());
  app.useBodyParser('json', { limit: '10mb' });
  app.useGlobalFilters(new AbortedRequestFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  const dataSource = app.get(DataSource);
  const databaseConfig = getDatabaseRuntimeConfig();

  // Enable CORS (supports exact origins or '*' for open staging demos)
  const corsOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://localhost:3001,http://localhost'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowAllOrigins = corsOrigins.includes('*');
  app.enableCors({
    origin: allowAllOrigins
      ? true
      : corsOrigins,
    credentials: true,
  });

  await ensureCanonicalSchema(dataSource);

  if (databaseConfig.autoSeed) {
    await runInitialSeed(dataSource);
  }

  await alignIdentitySequences(dataSource);

  if (rabbitEnabled) {
    await app.startAllMicroservices();
  } else {
    console.log('RabbitMQ disabled (set RABBITMQ_ENABLED=true to enable)');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port} (0.0.0.0)`);
}
bootstrap();
