import { Module } from '@nestjs/common';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { GetOrderUseCase } from './application/use-cases/get-order.use-case';
import { StartTripUseCase } from './application/use-cases/start-trip.use-case';
import { AddLogUseCase } from './application/use-cases/add-log.use-case';
import { DeliverOrderUseCase } from './application/use-cases/deliver-order.use-case';
import { PilotController } from './presentation/controller/pilot.controller';

/**
 * PilotModule — Portal del Piloto.
 *
 * Sigue el patrón de OperationsModule:
 *   - No necesita TypeOrmModule.forFeature() — usa DataSource directamente.
 *   - DataSource es inyectado globalmente por TypeOrmModule.forRoot en AppModule.
 *   - No envía emails, por lo que no importa NotificationsModule.
 */
@Module({
    providers: [
        ListOrdersUseCase,
        GetOrderUseCase,
        StartTripUseCase,
        AddLogUseCase,
        DeliverOrderUseCase,
    ],
    controllers: [PilotController],
})
export class PilotModule {}