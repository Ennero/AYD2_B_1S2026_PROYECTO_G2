import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ReplicaDatabaseModule,
    RabbitmqModule,
    HealthModule,
    NotificationsModule,
    UserModule,
    AuthModule,
    OperationsModule,
    LogisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
