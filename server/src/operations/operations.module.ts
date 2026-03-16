import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreateContractUseCase } from './application/use-cases/create-contract.use-case';
import { ListCargasUseCase } from './application/use-cases/list-cargas.use-case';
import { FormalizeCargaUseCase } from './application/use-cases/formalize-carga.use-case';
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
  providers: [CreateContractUseCase, ListCargasUseCase, FormalizeCargaUseCase],
  controllers: [OperationsController],
})
export class OperationsModule {}
