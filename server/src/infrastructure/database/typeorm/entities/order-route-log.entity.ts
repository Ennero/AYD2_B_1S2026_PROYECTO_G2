import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { RouteEventType } from '../../../../domain/enums/route-event-type.enum';
import { Order } from './order.entity';

@Entity('order_route_logs')
export class OrderRouteLog {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'log_id' })
  logId: number;

  @Column({ name: 'order_id', type: 'integer' })
  orderId: number;

  @Column({ name: 'event_type', type: 'enum', enum: RouteEventType })
  eventType: RouteEventType;

  @Column({ name: 'event_time', type: 'timestamptz', default: () => 'NOW()' })
  eventTime: Date;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @ManyToOne(() => Order, (order) => order.logs)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
