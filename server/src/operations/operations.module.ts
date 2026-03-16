import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClientFactory } from './application/factories/client.factory';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { CreateContractUseCase } from './application/use-cases/create-contract.use-case';
import { ClientsController } from './presentation/controllers/clients.controller';
import { OperationsController } from './presentation/controllers/operations.controller';

/**
 * OperationsModule — Agente Operativo.
 *
 * Usa DataSource (inyectado por TypeOrmModule.forRoot en AppModule) para
 * transacciones multi-entidad y NotificationsModule para envío de emails.
 *
 * Patrón de referencia para módulos de negocio futuros:
 *   1. Importar NotificationsModule si el módulo envía emails.
 *   2. Inyectar DataSource en use-cases con transacciones multi-tabla.
 *   3. Registrar use-cases en providers y el controller en controllers.
 */
@Module({
  imports: [NotificationsModule],
  providers: [CreateContractUseCase, CreateClientUseCase, ClientFactory],
  controllers: [OperationsController, ClientsController],
})
export class OperationsModule {}
