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

@Entity('contract_routes')
@Index(['contractId', 'routeId'], { unique: true })
export class ContractRoute {
  @PrimaryGeneratedColumn('uuid', { name: 'contract_route_id' })
  contractRouteId: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId: string;

  @Column({ name: 'route_id', type: 'bigint' })
  routeId: string;

  @Column({
    name: 'promised_delivery_hours',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  promisedDeliveryHours: number;

  @ManyToOne(() => Contract, (contract) => contract.contractRoutes)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => Route, (route) => route.contractRoutes)
  @JoinColumn({ name: 'route_id' })
  route: Route;

  @OneToMany(() => Order, (order) => order.contractRoute)
  orders: Order[];
}
