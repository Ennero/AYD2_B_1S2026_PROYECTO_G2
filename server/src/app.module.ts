import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from './infrastructure/database/config/data-source';
import { ReplicaDatabaseModule } from './infrastructure/database/replica-database.module';
import { RabbitmqModule } from './infrastructure/messaging/rabbitmq.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OperationsModule } from './operations/operations.module';
import { LogisticsModule } from './logistics/logistics.module';
import { CertifierModule } from './certifier/certifier.module';
import { PilotModule } from './pilot/pilot.module';
import { FinanceModule } from './finance/finance.module';
import { ClientPortalModule } from './client/client.module';
import { BiModule } from './bi/bi.module';
import { WebsocketModule } from './infrastructure/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,  limit: 20  },  // 20 req/s per IP
      { name: 'medium', ttl: 10000, limit: 100 },  // 100 req/10s per IP
    ]),
    TypeOrmModule.forRoot(dataSourceOptions),
    ReplicaDatabaseModule,
    RabbitmqModule,
    HealthModule,
    NotificationsModule,
    UserModule,
    AuthModule,
    OperationsModule,
    LogisticsModule,
    CertifierModule,
    PilotModule,
    FinanceModule,
    ClientPortalModule,
    BiModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
