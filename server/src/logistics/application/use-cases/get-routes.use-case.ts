import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';

export interface RouteItem {
  routeId: number;
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

  async execute(onlyActive: boolean): Promise<RouteItem[]> {
    const qb = this.dataSource
      .getRepository(Route)
      .createQueryBuilder('r')
      .orderBy('r.origin', 'ASC');

    if (onlyActive) {
      qb.where('r.is_active = true');
    }

    const routes = await qb.getMany();

    return routes.map((r) => ({
      routeId: r.routeId,
      routeCode: r.routeCode,
      origin: r.origin,
      destination: r.destination,
      distanceKm: Number(r.distanceKm),
      estimatedHours: Number(r.estimatedHours),
      isInternational: r.isInternational,
    }));
  }
}
