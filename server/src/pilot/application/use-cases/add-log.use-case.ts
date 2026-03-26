import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';

export interface AddLogInput {
    eventType: RouteEventType;
    description: string;
    imageBase64?: string;
}

export interface AddLogOutput {
    logId: number;
    eventTime: string;
    imagePath: string | null;
}

@Injectable()
export class AddLogUseCase {
    private readonly logger = new Logger(AddLogUseCase.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(
        orderId: number,
        pilotUserId: number,
        input: AddLogInput,
    ): Promise<AddLogOutput> {
        // 1. Verificar unidad del piloto
        const unit = await this.dataSource
        .getRepository(TransportUnit)
        .findOne({ where: { pilotUserId, isActive: true } });

        if (!unit) {
        throw new ForbiddenException('No tienes una unidad de transporte asignada.');
        }

        // 2. Cargar la orden
        const order = await this.dataSource
        .getRepository(Order)
        .findOneBy({ orderId });

        if (!order) {
        throw new NotFoundException(`Orden ${orderId} no encontrada.`);
        }

        // 3. Validar que la orden pertenece al piloto
        if (order.unitId !== unit.unitId) {
        throw new ForbiddenException('No tienes acceso a esta orden.');
        }

        // 4. Solo se puede registrar bitácora en órdenes EN_TRANSITO
        if (order.status !== OrderStatus.EN_TRANSITO) {
        throw new BadRequestException(
            `Solo se pueden registrar eventos en órdenes EN_TRANSITO. Estado actual: ${order.status}.`,
        );
        }

        // 5. Insertar el log
        const logRepo = this.dataSource.getRepository(OrderRouteLog);
        const eventTime = new Date();
        const imagePath = input.imageBase64
            ? await this.saveBase64File(input.imageBase64, 'logs', `${order.orderNumber}-log-${eventTime.getTime()}.jpg`)
            : null;
        const log = logRepo.create({
        orderId: order.orderId,
        eventType: input.eventType,
        description: input.description,
        eventTime,
        imagePath,
        });
        const saved = await logRepo.save(log);

        return {
        logId:     saved.logId,
        eventTime: saved.eventTime.toISOString(),
        imagePath: saved.imagePath ?? null,
        };
    }

    private async saveBase64File(
        base64: string,
        folder: string,
        filename: string,
    ): Promise<string | null> {
        try {
            const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const dir = join(process.cwd(), 'uploads', folder);
            await mkdir(dir, { recursive: true });

            const filePath = join(dir, filename);
            await writeFile(filePath, buffer);

            return `/files/${folder}/${filename}`;
        } catch (err) {
            this.logger.error(`Error guardando imagen de bitacora ${filename}: ${(err as Error).message}`);
            return null;
        }
    }
}