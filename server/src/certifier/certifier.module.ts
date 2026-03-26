import { Module } from '@nestjs/common';
import { CertifierController } from './presentation/controllers/certifier.controller';
import { CertifierService } from './application/services/certifier.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CertifierController],
  providers: [CertifierService],
})
export class CertifierModule {}
