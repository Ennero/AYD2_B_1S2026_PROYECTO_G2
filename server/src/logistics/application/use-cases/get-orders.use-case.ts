import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export interface GetOrdersInput {
  status?: OrderStatus;
  startDate?: string;
  clientId?: string;
  clientName?: string;
}

export interface OrderSummary {
  orderId: string;
  orderNumber: string;
  clientName: string;
  origin: string;
  destination: string;
  declaredWeightTon: number;
  cargoType: string;
  status: OrderStatus;
  requestedAt: Date;
}

@Injectable()
export class GetOrdersUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(input: GetOrdersInput): Promise<OrderSummary[]> {
    const qb = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('o')
      .innerJoin('o.contract', 'ct')
      .innerJoin('ct.client', 'c')
      .innerJoin('o.cargoType', 'cargo')
      .select([
        'o.orderId        AS "orderId"',
        'o.orderNumber    AS "orderNumber"',
        'c.legalName      AS "clientName"',
        'o.origin         AS "origin"',
        'o.destination    AS "destination"',
        'o.declaredWeightTon AS "declaredWeightTon"',
        'cargo.cargoName  AS "cargoType"',
        'o.status         AS "status"',
        'o.requestedAt    AS "requestedAt"',
      ])
      .orderBy('o.requestedAt', 'DESC');

    if (input.status) {
      qb.andWhere('o.status = :status', { status: input.status });
    }

    if (input.startDate) {
      qb.andWhere('o.requestedAt >= :startDate', {
        startDate: new Date(input.startDate),
      });
    }

    if (input.clientId) {
      qb.andWhere('c.clientId = :clientId', { clientId: input.clientId });
    }

    if (input.clientName) {
      qb.andWhere('c.legal_name ILIKE :clientName', {
        clientName: `%${input.clientName}%`,
      });
    }

    return qb.getRawMany<OrderSummary>();
  }
}
