import { Injectable, NotFoundException } from '@nestjs/common';
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
        { status: OrderStatus.REGISTRADA } // También registradas por si no hay asignación aún
      ],
      relations: ['contractRoute', 'unit'],
      order: {
        requestedAt: 'DESC'
      }
    });

    return orders.map(order => ({
      id: order.orderId,
      codigo: order.orderNumber,
      // Map mock data if real data is missing until relationships are fully seeded
      piloto: "Piloto Asignado", // TODO: join with transport unit driver
      vehiculo: order.unit?.plateNumber || "Pendiente de Asignación",
      fecha: order.requestedAt.toLocaleDateString('es-GT'),
      origen: order.origin || order.pickupAddress,
      destino: order.destination || order.deliveryAddress,
      estado: order.status === OrderStatus.LISTA_PARA_DESPACHO ? 'FORMALIZADO' : 'PENDIENTE',
      idOrden: order.orderNumber.replace(/[^0-9]/g, '').substring(0, 4) || "0",
      peso: order.loadedWeightTon || 0,
      estibaValida: order.stowageConfirmed || false,
    }));
  }
}
