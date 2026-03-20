import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreateContractUseCase } from './application/use-cases/create-contract.use-case';
import { ListCargasUseCase } from './application/use-cases/list-cargas.use-case';
import { FormalizeCargaUseCase } from './application/use-cases/formalize-carga.use-case';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { GetClientsUseCase } from './application/use-cases/get-clients.use-case';
import { OperationsController } from './presentation/controllers/operations.controller';

/**
 * OperationsModule — Agente Operativo + Encargado de Patio.
 */
@Module({
  imports: [NotificationsModule],
  providers: [
    CreateContractUseCase,
    ListCargasUseCase,
    FormalizeCargaUseCase,
    CreateClientUseCase,
    GetClientsUseCase,
  ],
  controllers: [OperationsController],
})
export class OperationsModule {}
