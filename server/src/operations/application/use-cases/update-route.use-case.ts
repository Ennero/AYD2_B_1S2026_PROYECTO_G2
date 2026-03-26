import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';

interface UpdateRouteInput {
  routeCode: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedHours: number;
  isInternational: boolean;
}

@Injectable()
export class UpdateRouteUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(routeId: number, input: UpdateRouteInput): Promise<Route> {
    const routeRepo = this.dataSource.getRepository(Route);

    const route = await routeRepo.findOne({ where: { routeId } });
    if (!route) {
      throw new NotFoundException(`No existe la ruta con ID ${routeId}.`);
    }

    const normalizedRouteCode = input.routeCode.toUpperCase().trim();
    const normalizedOrigin = input.origin.toUpperCase().trim();
    const normalizedDestination = input.destination.toUpperCase().trim();

    const existingWithSameCode = await routeRepo
      .createQueryBuilder('route')
      .where('route.route_code = :routeCode', { routeCode: normalizedRouteCode })
      .andWhere('route.route_id != :routeId', { routeId })
      .getOne();

    if (existingWithSameCode) {
      throw new ConflictException(`La ruta ${normalizedRouteCode} ya existe en el catálogo.`);
    }

    const existingWithSamePath = await routeRepo
      .createQueryBuilder('route')
      .where('route.origin = :origin', { origin: normalizedOrigin })
      .andWhere('route.destination = :destination', {
        destination: normalizedDestination,
      })
      .andWhere('route.route_id != :routeId', { routeId })
      .getOne();

    if (existingWithSamePath) {
      throw new ConflictException(
        `La ruta ${normalizedOrigin} -> ${normalizedDestination} ya existe en el catálogo.`,
      );
    }

    route.routeCode = normalizedRouteCode;
    route.origin = normalizedOrigin;
    route.destination = normalizedDestination;
    route.distanceKm = input.distanceKm;
    route.estimatedHours = input.estimatedHours;
    route.isInternational = input.isInternational;

    return routeRepo.save(route);
  }
}