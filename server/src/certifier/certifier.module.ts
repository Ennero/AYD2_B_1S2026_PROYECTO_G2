import { Module } from '@nestjs/common';
import { CertifierController } from './presentation/controllers/certifier.controller';
import { CertifierService } from './application/services/certifier.service';

@Module({
  controllers: [CertifierController],
  providers: [CertifierService]
})
export class CertifierModule {}
