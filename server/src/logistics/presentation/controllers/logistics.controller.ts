import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import { GetDashboardSummaryUseCase } from '../../application/use-cases/get-dashboard-summary.use-case';
import { GetOrdersUseCase } from '../../application/use-cases/get-orders.use-case';
import { GetOrderDetailUseCase } from '../../application/use-cases/get-order-detail.use-case';
import { GetUnitBinomialsUseCase } from '../../application/use-cases/get-unit-binomials.use-case';
import { AssignOrderUseCase } from '../../application/use-cases/assign-order.use-case';
import { GetRoutesUseCase } from '../../application/use-cases/get-routes.use-case';
import { AssignOrderDto } from '../dtos/assign-order.dto';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

@Controller('api/logistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.AGENTE_LOGISTICO)
export class LogisticsController {
  constructor(
    private readonly getDashboardSummary: GetDashboardSummaryUseCase,
    private readonly getOrders: GetOrdersUseCase,
    private readonly getOrderDetail: GetOrderDetailUseCase,
    private readonly getUnitBinomials: GetUnitBinomialsUseCase,
    private readonly assignOrder: AssignOrderUseCase,
    private readonly getRoutes: GetRoutesUseCase,
  ) {}

  /**
   * GET /api/logistics/dashboard/summary
   * Resumen para la pantalla de bienvenida: órdenes pendientes + unidades disponibles.
   */
  @Get('dashboard/summary')
  async summary() {
    const data = await this.getDashboardSummary.execute();
    return { message: 'Resumen logístico obtenido correctamente', data };
  }

  /**
   * GET /api/logistics/orders
   * Lista de órdenes con filtros opcionales: status, startDate, clientId.
   */
  @Get('orders')
  async listOrders(
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('clientId') clientId?: string,
  ) {
    const data = await this.getOrders.execute({ status, startDate, clientId });
    return { message: 'Órdenes obtenidas correctamente', data };
  }

  /**
   * GET /api/logistics/orders/:id
   * Detalle completo de una orden.
   */
  @Get('orders/:id')
  async orderDetail(@Param('id') id: string) {
    const data = await this.getOrderDetail.execute(id);
    return { message: 'Detalle de orden obtenido correctamente', data };
  }

  /**
   * GET /api/logistics/unit-binomials?orderId=<uuid>
   * Binomios piloto+vehículo compatibles con la orden indicada.
   */
  @Get('unit-binomials')
  async unitBinomials(@Query('orderId') orderId: string) {
    const data = await this.getUnitBinomials.execute(orderId);
    return { message: 'Binomios obtenidos correctamente', data };
  }

  /**
   * GET /api/logistics/routes?isActive=true
   * Catálogo de rutas (reutilizado desde el módulo de logística).
   */
  @Get('routes')
  async routes(@Query('isActive') isActive?: string) {
    const onlyActive = isActive !== 'false';
    const data = await this.getRoutes.execute(onlyActive);
    return { message: 'Rutas obtenidas correctamente', data };
  }

  /**
   * PATCH /api/logistics/orders/:id/assignment
   * Asigna piloto+vehículo y ruta a una orden. Cambia estado a ASIGNADA.
   * El trigger VALIDATE_ORDER_ASSIGNMENT valida todo en la DB.
   */
  @Patch('orders/:id/assignment')
  @HttpCode(HttpStatus.OK)
  async assign(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    const data = await this.assignOrder.execute({
      orderId: id,
      contractRouteId: dto.contractRouteId,
      binomialId: dto.binomialId,
      scheduledDeparture: dto.scheduledDeparture,
    });
    return { message: 'Orden asignada correctamente', data };
  }
}
