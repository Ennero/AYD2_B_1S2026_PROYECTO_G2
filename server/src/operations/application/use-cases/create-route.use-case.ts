import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';

@Injectable()
export class CreateRouteUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(dto: {
    routeCode: string;
    origin: string;
    destination: string;
    distanceKm: number;
    estimatedHours: number;
    isInternational: boolean;
  }): Promise<Route> {
    const routeRepo = this.dataSource.getRepository(Route);

    // Normalizar a mayúsculas
    const upperCode = dto.routeCode.toUpperCase().trim();

    const existing = await routeRepo.findOne({
      where: { routeCode: upperCode },
    });
    if (existing) {
      throw new ConflictException(
        `La ruta ${upperCode} ya existe en el catálogo.`,
      );
    }

    const newRoute = routeRepo.create({
      routeCode: upperCode,
      origin: dto.origin.toUpperCase().trim(),
      destination: dto.destination.toUpperCase().trim(),
      distanceKm: dto.distanceKm,
      estimatedHours: dto.estimatedHours,
      isInternational: dto.isInternational,
    });

    return await routeRepo.save(newRoute);
  }
}
