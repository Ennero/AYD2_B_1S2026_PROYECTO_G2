import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { TransportUnit } from '../../../infrastructure/database/typeorm/entities/transport-unit.entity';

export interface UnitBinomial {
  binomialId: string;
  unitId: string;
  pilotUserId: string | null;
  pilotName: string | null;
  plateNumber: string;
  vehicleType: string;
  capacityTon: number;
  hasRefrigeration: boolean;
}

@Injectable()
export class GetUnitBinomialsUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(orderId: string): Promise<UnitBinomial[]> {
    // Cargar la orden para saber peso y tipo de carga
    const order = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.cargoType', 'cargo')
      .where('o.orderId = :orderId', { orderId })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Orden ${orderId} no encontrada.`);
    }

    const today = new Date().toISOString().split('T')[0];

    let qb = this.dataSource
      .getRepository(TransportUnit)
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.vehicleType', 'vt')
      .leftJoinAndSelect('u.pilotUser', 'pilot')
      .where('u.is_active = true')
      .andWhere('u.pilot_license_expiration >= :today', { today })
      .andWhere('u.vehicle_document_expiration >= :today', { today })
      .andWhere('u.capacity_ton >= :weight', {
        weight: order.declaredWeightTon,
      });

    // Si la carga requiere refrigeración, filtrar unidades con refrigeración
    if (order.cargoType?.requiresRefrigeration) {
      qb = qb.andWhere('u.has_refrigeration = true');
    }

    const units = await qb.getMany();

    return units.map((u) => ({
      binomialId: `unit:${u.unitId}`,
      unitId: u.unitId,
      pilotUserId: u.pilotUserId,
      pilotName: u.pilotUser?.fullName ?? null,
      plateNumber: u.plateNumber,
      vehicleType: u.vehicleType?.typeName ?? '',
      capacityTon: Number(u.capacityTon),
      hasRefrigeration: u.hasRefrigeration,
    }));
  }
}
