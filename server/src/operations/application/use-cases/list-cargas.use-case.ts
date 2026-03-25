import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../../../infrastructure/database/typeorm/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

@Injectable()
export class ListCargasUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<any[]> {
    const orderRepo = this.dataSource.getRepository(Order);

    // Listamos órdenes que están en ASIGNADA (Pendiente de formalizar) 
    // o LISTA_PARA_DESPACHO (Ya formalizada)
    const orders = await orderRepo.find({
      where: [
        { status: OrderStatus.ASIGNADA },
        { status: OrderStatus.LISTA_PARA_DESPACHO },
      ],
      relations: ['contractRoute', 'unit', 'unit.pilotUser'],
      order: {
        requestedAt: 'DESC'
      }
    });

    return orders.map(order => ({
      id: order.orderId,
      codigo: order.orderNumber,
      unitId: order.unitId,
      pilotName: order.unit?.pilotUser?.fullName || 'Piloto no asignado',
      vehicleModel: order.unit?.vehicleModel || 'Modelo no disponible',
      plateNumber: order.unit?.plateNumber || 'Pendiente de Asignación',
      fecha: order.requestedAt.toLocaleDateString('es-GT'),
      origen: order.origin || order.pickupAddress,
      destino: order.destination || order.deliveryAddress,
      estado: order.status === OrderStatus.LISTA_PARA_DESPACHO ? 'FORMALIZADO' : 'PENDIENTE',
      peso: order.loadedWeightTon || order.declaredWeightTon || 0,
      estibaValida: order.stowageConfirmed || false,
    }));
  }
}
