import { Module } from '@nestjs/common';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { GetOrdersUseCase } from './application/use-cases/get-orders.use-case';
import { GetOrderDetailUseCase } from './application/use-cases/get-order-detail.use-case';
import { GetUnitBinomialsUseCase } from './application/use-cases/get-unit-binomials.use-case';
import { AssignOrderUseCase } from './application/use-cases/assign-order.use-case';
import { GetRoutesUseCase } from './application/use-cases/get-routes.use-case';
import { LogisticsController } from './presentation/controllers/logistics.controller';

/**
 * LogisticsModule — Agente Logístico.
 *
 * Todos los use-cases usan DataSource directamente (inyectado globalmente
 * por TypeOrmModule.forRoot en AppModule). No requiere NotificationsModule
 * ya que este módulo no envía emails.
 */
@Module({
  providers: [
    GetDashboardSummaryUseCase,
    GetOrdersUseCase,
    GetOrderDetailUseCase,
    GetUnitBinomialsUseCase,
    AssignOrderUseCase,
    GetRoutesUseCase,
  ],
  controllers: [LogisticsController],
})
export class LogisticsModule {}
