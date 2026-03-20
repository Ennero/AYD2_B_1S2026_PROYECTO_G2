import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { Contract } from './contract.entity';
import { Route } from './route.entity';
import { Order } from './order.entity';

@Entity('contract_routes')
@Index(['contractId', 'routeId'], { unique: true })
@Index(['contractRouteId', 'contractId'], { unique: true })
export class ContractRoute {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'contract_route_id' })
  contractRouteId: string;

  @Column({ name: 'contract_id', type: 'varchar', length: 36 })
  contractId: string;

  @Column({ name: 'route_id', type: 'bigint' })
  routeId: string;

  @Column({
    name: 'promised_delivery_hours',
    type: 'numeric',
    precision: 10,
    scale: 2 })
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
