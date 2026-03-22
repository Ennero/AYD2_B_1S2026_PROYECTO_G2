import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';

export interface DeliverOrderInput {
    receiverName: string;
    receiverSignatureBase64: string;
    deliveryEvidenceBase64?: string[];
    deliveredAt?: string;
    notes?: string;
}

export interface DeliverOrderOutput {
    orderId: number;
    status: OrderStatus;
    deliveredAt: string;
    receiverSignaturePath: string;
}

@Injectable()
export class DeliverOrderUseCase {
    private readonly logger = new Logger(DeliverOrderUseCase.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(
        orderId: number,
        pilotUserId: number,
        input: DeliverOrderInput,
    ): Promise<DeliverOrderOutput> {
        // 1. Verificar unidad del piloto
        const unit = await this.dataSource
        .getRepository(TransportUnit)
        .findOne({ where: { pilotUserId, isActive: true } });

        if (!unit) {
        throw new ForbiddenException('No tienes una unidad de transporte asignada.');
        }

        return this.dataSource.transaction(async (em) => {
            const orderRepo = em.getRepository(Order);
            const order = await orderRepo.findOneBy({ orderId });

            if (!order) {
                throw new NotFoundException(`Orden ${orderId} no encontrada.`);
            }

            // 2. Validar que la orden pertenece al piloto
            if (order.unitId !== unit.unitId) {
                throw new ForbiddenException('No tienes acceso a esta orden.');
            }

            // 3. Solo se puede entregar desde EN_TRANSITO
            if (order.status !== OrderStatus.EN_TRANSITO) {
                throw new BadRequestException(
                `La orden ${order.orderNumber} debe estar EN_TRANSITO para registrar la entrega. Estado actual: ${order.status}.`,
                );
            }

            // 4. Persistir archivos base64 en disco
            const signaturePath = await this.saveBase64File(
                input.receiverSignatureBase64,
                `signatures`,
                `${order.orderNumber}-signature.png`,
            );

            let evidencePath: string | null = null;
            if (input.deliveryEvidenceBase64?.length) {
                // Guardar la primera foto como evidencia principal
                // (el frontend puede enviar un array; guardamos todas con índice)
                const paths: string[] = [];
                for (let i = 0; i < input.deliveryEvidenceBase64.length; i++) {
                const p = await this.saveBase64File(
                    input.deliveryEvidenceBase64[i],
                    `evidence`,
                    `${order.orderNumber}-evidence-${i + 1}.jpg`,
                );
                paths.push(p);
                }
                evidencePath = paths.join(',');
            }

            // 5. Actualizar la orden a ENTREGADA
            // El trigger TRG_AUTO_CREATE_DRAFT_INVOICE en la DB crea
            // automáticamente el borrador de factura en INVOICES cuando
            // el status cambia a ENTREGADA — no se requiere acción adicional.
            const deliveredAt = input.deliveredAt ? new Date(input.deliveredAt) : new Date();
            order.status                = OrderStatus.ENTREGADA;
            order.deliveredAt           = deliveredAt;
            order.receiverName          = input.receiverName;
            order.receiverSignaturePath = signaturePath;
            order.deliveryEvidencePath  = evidencePath;
            if (input.notes) order.notes = input.notes;
            await orderRepo.save(order);

            // 6. Registrar evento de LLEGADA en bitácora
            const logRepo = em.getRepository(OrderRouteLog);
            const log = logRepo.create({
                orderId:     order.orderId,
                eventType:   RouteEventType.LLEGADA,
                description: `Entrega confirmada. Receptor: ${input.receiverName}.`,
                eventTime:   deliveredAt,
            });
            await logRepo.save(log);

            return {
                orderId:               order.orderId,
                status:                order.status,
                deliveredAt:           deliveredAt.toISOString(),
                receiverSignaturePath: signaturePath,
            };
        });
    }

    // ── Utilidad privada: decodifica base64 y guarda en disco ─────────────
    private async saveBase64File(
        base64: string,
        folder: string,
        filename: string,
    ): Promise<string> {
        try {
        // Remover prefijo "data:image/...;base64," si viene del canvas
        const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const dir = join(process.cwd(), 'uploads', folder);
        await mkdir(dir, { recursive: true });

        const filePath = join(dir, filename);
        await writeFile(filePath, buffer);

        // Retornar ruta relativa para guardar en DB
        return `/files/${folder}/${filename}`;
        } catch (err) {
        this.logger.error(`Error guardando archivo ${filename}: ${(err as Error).message}`);
        // No bloqueamos la entrega por fallo en guardado de archivo
        return `/files/${folder}/${filename}`;
        }
    }
}   