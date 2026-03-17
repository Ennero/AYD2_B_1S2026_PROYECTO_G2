import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
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

/**
 * PilotController — Portal del Piloto.
 *
 * Todos los endpoints requieren rol PILOTO.
 * El pilotUserId se extrae del JWT para aislar
 * los datos de cada piloto sin parámetro extra.
 */
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
     * Lista todas las órdenes asignadas al piloto autenticado.
     */
    @Get('orders')
    @HttpCode(HttpStatus.OK)
    async listOrders(@CurrentUser() user: JwtPayload) {
        const data = await this.listOrdersUseCase.execute(user.sub);
        return { message: 'Viajes obtenidos', data };
    }

    /**
     * GET /api/pilot/orders/:id
     * Detalle completo de una orden con su bitácora.
     */
    @Get('orders/:id')
    @HttpCode(HttpStatus.OK)
    async getOrder(
        @Param('id') orderId: string,
        @CurrentUser() user: JwtPayload,
    ) {
        const data = await this.getOrderUseCase.execute(orderId, user.sub);
        return { message: 'Detalle del viaje obtenido', data };
    }

    /**
     * PATCH /api/pilot/orders/:id/status
     * Inicia el viaje cambiando el estado a EN_TRANSITO.
     * Body: { status: "EN_TRANSITO" }
     */
    @Patch('orders/:id/status')
    @HttpCode(HttpStatus.OK)
    async startTrip(
        @Param('id') orderId: string,
        @CurrentUser() user: JwtPayload,
    ) {
        const data = await this.startTripUseCase.execute(orderId, user.sub);
        return { message: 'Estado actualizado correctamente', data };
    }

    /**
     * POST /api/pilot/orders/:id/logs
     * Registra un nuevo evento en la bitácora ORDER_ROUTE_LOGS.
     * Body: { eventType, description }
     */
    @Post('orders/:id/logs')
    @HttpCode(HttpStatus.CREATED)
    async addLog(
        @Param('id') orderId: string,
        @Body() dto: AddLogDto,
        @CurrentUser() user: JwtPayload,
    ) {
        const data = await this.addLogUseCase.execute(orderId, user.sub, {
        eventType:   dto.eventType,
        description: dto.description,
        });
        return { message: 'Evento registrado correctamente', data };
    }

    /**
     * PATCH /api/pilot/orders/:id/deliver
     * Confirma la entrega con firma y evidencia fotográfica.
     * Cambia estado a ENTREGADA y dispara TRG_AUTO_CREATE_DRAFT_INVOICE.
     */
    @Patch('orders/:id/deliver')
    @HttpCode(HttpStatus.OK)
    async deliverOrder(
        @Param('id') orderId: string,
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