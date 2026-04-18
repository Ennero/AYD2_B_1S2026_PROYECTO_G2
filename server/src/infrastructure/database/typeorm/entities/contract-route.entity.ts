import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Contract } from './contract.entity';
import { Route } from './route.entity';
import { Order } from './order.entity';

@Entity('contract_routes')
@Index(['contractId', 'routeId'], { unique: true })
@Index(['contractRouteId', 'contractId'], { unique: true })
export class ContractRoute {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'contract_route_id' })
  contractRouteId: number;

  @Column({ name: 'contract_id', type: 'integer' })
  contractId: number;

  @Column({ name: 'route_id', type: 'integer' })
  routeId: number;

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
