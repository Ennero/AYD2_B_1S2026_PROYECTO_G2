import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ContractStatus } from '../../../domain/enums/contract-status.enum';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { ContractRoute } from '../../../infrastructure/database/typeorm/entities/contract-route.entity';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { Route } from '../../../infrastructure/database/typeorm/entities/route.entity';

@Injectable()
export class DeleteRouteUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(routeId: number): Promise<{ routeId: number; routeCode: string; isActive: boolean }> {
    const routeRepo = this.dataSource.getRepository(Route);

    const route = await routeRepo.findOne({ where: { routeId } });
    if (!route) {
      throw new NotFoundException(`No existe la ruta con ID ${routeId}.`);
    }

    if (!route.isActive) {
      throw new BadRequestException(`La ruta ${route.routeCode} ya se encuentra desactivada.`);
    }

    const contractsUsingRoute = await this.dataSource
      .getRepository(ContractRoute)
      .createQueryBuilder('contractRoute')
      .innerJoin('contractRoute.contract', 'contract')
      .where('contractRoute.route_id = :routeId', { routeId })
      .andWhere('contract.status IN (:...activeStatuses)', {
        activeStatuses: [ContractStatus.PENDIENTE, ContractStatus.VIGENTE],
      })
      .getCount();

    if (contractsUsingRoute > 0) {
      throw new ConflictException(
        `No se puede desactivar ${route.routeCode} porque está asociada a contratos pendientes o vigentes.`,
      );
    }

    const ordersUsingRoute = await this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .innerJoin('order.contractRoute', 'contractRoute')
      .where('contractRoute.route_id = :routeId', { routeId })
      .andWhere('order.status IN (:...activeOrderStatuses)', {
        activeOrderStatuses: [
          OrderStatus.REGISTRADA,
          OrderStatus.ASIGNADA,
          OrderStatus.LISTA_PARA_DESPACHO,
          OrderStatus.EN_TRANSITO,
          OrderStatus.BLOQUEADA,
        ],
      })
      .getCount();

    if (ordersUsingRoute > 0) {
      throw new ConflictException(
        `No se puede desactivar ${route.routeCode} porque tiene órdenes activas relacionadas.`,
      );
    }

    route.isActive = false;
    await routeRepo.save(route);

    return {
      routeId: route.routeId,
      routeCode: route.routeCode,
      isActive: route.isActive,
    };
  }
}