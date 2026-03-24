import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClientFactory } from './application/factories/client.factory';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { CreateContractUseCase } from './application/use-cases/create-contract.use-case';
import { GetClientsUseCase } from './application/use-cases/get-clients.use-case';
import { GetCargoTypesUseCase } from './application/use-cases/get-cargo-types.use-case';
import { GetRoutesUseCase } from './application/use-cases/get-routes.use-case';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { ClientsController } from './presentation/controllers/clients.controller';
import { ListCargasUseCase } from './application/use-cases/list-cargas.use-case';
import { FormalizeCargaUseCase } from './application/use-cases/formalize-carga.use-case';
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
    GetRoutesUseCase,
    GetCargoTypesUseCase,
    GetUsersUseCase,
    UpdateUserUseCase,
    ClientFactory,
  ],
  controllers: [OperationsController, ClientsController],
})
export class OperationsModule {}
