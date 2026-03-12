import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RouteEventType } from '../../../../domain/enums/route-event-type.enum';
import { Order } from './order.entity';

@Entity('ORDER_ROUTE_LOGS')
export class OrderRouteLog {
  @PrimaryGeneratedColumn('uuid', { name: 'LOG_ID' })
  logId: string;

  @Column({ name: 'ORDER_ID', type: 'uuid' })
  orderId: string;

  @Column({ name: 'EVENT_TYPE', type: 'enum', enum: RouteEventType })
  eventType: RouteEventType;

  @Column({ name: 'EVENT_TIME', type: 'timestamptz' })
  eventTime: Date;

  @Column({ name: 'DESCRIPTION', type: 'text' })
  description: string;

  @ManyToOne(() => Order, (order) => order.logs)
  @JoinColumn({ name: 'ORDER_ID' })
  order: Order;
}
