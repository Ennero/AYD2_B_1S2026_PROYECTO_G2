import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
    Inject,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderRouteLog } from '../../../infrastructure/database/typeorm/entities/order-route-log.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { RouteEventType } from '../../../domain/enums/route-event-type.enum';
import { STORAGE_SERVICE_TOKEN } from '../../../storage/domain/storage.service.interface';
import type { IStorageService } from '../../../storage/domain/storage.service.interface';

export interface DeliverOrderInput {
    receiverName: string;
    receiverSignatureBase64: string;
    deliveryEvidenceBase64: string[];
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

    constructor(
        private readonly dataSource: DataSource,
        private readonly config: ConfigService,
        @Inject(STORAGE_SERVICE_TOKEN) private readonly storage: IStorageService,
    ) {}

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

            // 4. Subir archivos a Supabase Storage
            const sigBucket = this.config.get('SUPABASE_BUCKET_SIGNATURES', 'signatures');
            const eviBucket = this.config.get('SUPABASE_BUCKET_EVIDENCE', 'evidence');

            const evidenceImages = (input.deliveryEvidenceBase64 ?? []).filter(
                (image) => typeof image === 'string' && image.trim().length > 0,
            );

            if (evidenceImages.length === 0) {
                throw new BadRequestException(
                    'Debes adjuntar al menos una evidencia fotografica para confirmar la entrega.',
                );
            }

            const signaturePath = await this.uploadBase64File(
                input.receiverSignatureBase64,
                sigBucket,
                `${order.orderNumber}-signature.png`,
                'image/png',
            );

            const paths: string[] = [];
            for (let i = 0; i < Math.min(evidenceImages.length, 3); i++) {
                const p = await this.uploadBase64File(
                    evidenceImages[i],
                    eviBucket,
                    `${order.orderNumber}-evidence-${i + 1}.jpg`,
                    'image/jpeg',
                );
                if (p) {
                    paths.push(p);
                }
            }

            if (paths.length === 0) {
                throw new BadRequestException(
                    'No se pudo almacenar la evidencia fotografica. Intenta nuevamente.',
                );
            }

            const evidencePath = paths.join(',');

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

            // 7. Marcar la unidad como disponible nuevamente
            const unitRepo = em.getRepository(TransportUnit);
            await unitRepo.update(unit.unitId, { isAvailable: true });

            return {
                orderId:               order.orderId,
                status:                order.status,
                deliveredAt:           deliveredAt.toISOString(),
                receiverSignaturePath: signaturePath,
            };
        });
    }

    // ── Utilidad privada: decodifica base64 y sube a Supabase Storage ─────
    private async uploadBase64File(
        base64: string,
        bucket: string,
        filename: string,
        mimeType: string,
    ): Promise<string> {
        try {
            const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const result = await this.storage.upload({ buffer, filename, bucket, mimeType });
            if (!result.success || !result.url) {
                this.logger.warn(`Storage upload failed for ${filename}: ${result.error}`);
                return '';
            }
            return result.url;
        } catch (err) {
            this.logger.error(`uploadBase64File failed for ${filename}: ${(err as Error).message}`);
            return '';
        }
    }
}
