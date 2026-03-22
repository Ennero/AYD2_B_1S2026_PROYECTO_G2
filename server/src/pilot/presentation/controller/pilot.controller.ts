import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { USER_ROLE } from '../../../auth/domain/enums/user-role.enum';
import type { JwtPayload } from '../../../auth/domain/interfaces/jwt-payload.interface';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { StartTripUseCase } from '../../application/use-cases/start-trip.use-case';
import { AddLogUseCase } from '../../application/use-cases/add-log.use-case';
import { DeliverOrderUseCase } from '../../application/use-cases/deliver-order.use-case';
import { AddLogDto } from '../dtos/add-log.dto';
import { DeliverOrderDto } from '../dtos/deliver-order.dto';

@Controller('api/pilot')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.PILOTO)
export class PilotController {
  constructor(
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly startTripUseCase: StartTripUseCase,
    private readonly addLogUseCase: AddLogUseCase,
    private readonly deliverOrderUseCase: DeliverOrderUseCase,
  ) {}

  /**
   * GET /api/pilot/orders
   * Acepta query params opcionales:
   *   status, startDate, endDate, clientName, origin, destination, cargoType, sortByWeight
   */
  @Get('orders')
  @HttpCode(HttpStatus.OK)
  async listOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('clientName') clientName?: string,
    @Query('origin') origin?: string,
    @Query('destination') destination?: string,
    @Query('cargoType') cargoType?: string,
    @Query('sortByWeight') sortByWeight?: 'ASC' | 'DESC',
  ) {
    const data = await this.listOrdersUseCase.execute(user.sub, {
      status,
      startDate,
      endDate,
      clientName,
      origin,
      destination,
      cargoType,
      sortByWeight,
    });
    return { message: 'Viajes obtenidos', data };
  }

  /** GET /api/pilot/orders/:id */
  @Get('orders/:id')
  @HttpCode(HttpStatus.OK)
  async getOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.getOrderUseCase.execute(orderId, user.sub);
    return { message: 'Detalle del viaje obtenido', data };
  }

  /** PATCH /api/pilot/orders/:id/status */
  @Patch('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  async startTrip(
    @Param('id', ParseIntPipe) orderId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.startTripUseCase.execute(orderId, user.sub);
    return { message: 'Estado actualizado correctamente', data };
  }

  /** POST /api/pilot/orders/:id/logs */
  @Post('orders/:id/logs')
  @HttpCode(HttpStatus.CREATED)
  async addLog(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: AddLogDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.addLogUseCase.execute(orderId, user.sub, {
      eventType:   dto.eventType,
      description: dto.description,
    });
    return { message: 'Evento registrado correctamente', data };
  }

  /** PATCH /api/pilot/orders/:id/deliver */
  @Patch('orders/:id/deliver')
  @HttpCode(HttpStatus.OK)
  async deliverOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() dto: DeliverOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.deliverOrderUseCase.execute(orderId, user.sub, {
      receiverName:            dto.receiverName,
      receiverSignatureBase64: dto.receiverSignatureBase64,
      deliveryEvidenceBase64:  dto.deliveryEvidenceBase64,
      deliveredAt:             dto.deliveredAt,
      notes:                   dto.notes,
    });
    return { message: 'Entrega registrada correctamente', data };
  }
}