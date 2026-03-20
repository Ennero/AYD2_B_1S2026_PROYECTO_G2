import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';

export interface OperationRouteItem {
  routeId: string;
  routeCode: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedHours: number;
  isInternational: boolean;
}

@Injectable()
export class GetRoutesUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<OperationRouteItem[]> {
    const routes = await this.dataSource
      .getRepository(Route)
      .createQueryBuilder('r')
      .where('r.isActive = :isActive', { isActive: true })
      .orderBy('r.origin', 'ASC')
      .addOrderBy('r.destination', 'ASC')
      .getMany();

    return routes.map((route) => ({
      routeId: route.routeId,
      routeCode: route.routeCode,
      origin: route.origin,
      destination: route.destination,
      distanceKm: Number(route.distanceKm),
      estimatedHours: Number(route.estimatedHours),
      isInternational: route.isInternational,
    }));
  }
}
