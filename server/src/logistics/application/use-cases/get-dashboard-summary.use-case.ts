import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export interface DashboardSummaryOutput {
  pendingOrders: number;
  availableUnits: number;
}

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<DashboardSummaryOutput> {
    const orderRepo = this.dataSource.getRepository(Order);
    const unitRepo = this.dataSource.getRepository(TransportUnit);

    const pendingOrders = await orderRepo.count({
      where: { status: OrderStatus.REGISTRADA },
    });

    // Unidades en uso: asignadas a órdenes activas
    const activeOrders = await orderRepo
      .createQueryBuilder('o')
      .select('o.unit_id', 'unitId')
      .where('o.status IN (:...statuses)', {
        statuses: [
          OrderStatus.ASIGNADA,
          OrderStatus.LISTA_PARA_DESPACHO,
          OrderStatus.EN_TRANSITO,
        ],
      })
      .andWhere('o.unit_id IS NOT NULL')
      .getRawMany<{ unitId: string }>();

    const busyUnitIds = activeOrders.map((r) => r.unitId);

    const today = new Date().toISOString().split('T')[0];

    let qb = unitRepo
      .createQueryBuilder('u')
      .where('u.is_active = true')
      .andWhere('u.pilot_license_expiration >= :today', { today })
      .andWhere('u.vehicle_document_expiration >= :today', { today });

    if (busyUnitIds.length > 0) {
      qb = qb.andWhere('u.unit_id NOT IN (:...busyUnitIds)', { busyUnitIds });
    }

    const availableUnits = await qb.getCount();

    return { pendingOrders, availableUnits };
  }
}
