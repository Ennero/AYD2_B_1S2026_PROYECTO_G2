import { Module } from '@nestjs/common';
import { ClientController } from './presentation/controllers/client.controller';
import { ClientService } from './application/services/client.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientPortalModule {}
