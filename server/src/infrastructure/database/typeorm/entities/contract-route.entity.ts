import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Contract } from './contract.entity';
import { Route } from './route.entity';
import { Order } from './order.entity';

@Entity('CONTRACT_ROUTES')
@Index(['contractId', 'routeId'], { unique: true })
export class ContractRoute {
  @PrimaryGeneratedColumn('uuid', { name: 'CONTRACT_ROUTE_ID' })
  contractRouteId: string;

  @Column({ name: 'CONTRACT_ID', type: 'uuid' })
  contractId: string;

  @Column({ name: 'ROUTE_ID', type: 'bigint' })
  routeId: string;

  @Column({
    name: 'PROMISED_DELIVERY_HOURS',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  promisedDeliveryHours: number;

  @ManyToOne(() => Contract, (contract) => contract.contractRoutes)
  @JoinColumn({ name: 'CONTRACT_ID' })
  contract: Contract;

  @ManyToOne(() => Route, (route) => route.contractRoutes)
  @JoinColumn({ name: 'ROUTE_ID' })
  route: Route;

  @OneToMany(() => Order, (order) => order.contractRoute)
  orders: Order[];
}
