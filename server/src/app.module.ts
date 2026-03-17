import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from './infrastructure/database/config/data-source';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OperationsModule } from './operations/operations.module';
import { LogisticsModule } from './logistics/logistics.module';
import { CertifierModule } from './certifier/certifier.module';
import { PilotModule } from './pilot/pilot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    HealthModule,
    NotificationsModule,
    UserModule,
    AuthModule,
    OperationsModule,
    LogisticsModule,
    CertifierModule,
    PilotModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
