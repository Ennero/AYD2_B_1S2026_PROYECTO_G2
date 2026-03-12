import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { ContractRoute } from './contract-route.entity';

@Entity('ROUTES')
export class Route {
  @PrimaryColumn('bigint', { name: 'ROUTE_ID' })
  routeId: string; // bigint is represented as string in JS/TS to avoid precision loss

  @Column({ name: 'ROUTE_CODE', type: 'varchar', length: 30, unique: true })
  routeCode: string;

  @Column({ name: 'ORIGIN', type: 'varchar', length: 120 })
  origin: string;

  @Column({ name: 'DESTINATION', type: 'varchar', length: 120 })
  destination: string;

  @Column({ name: 'DISTANCE_KM', type: 'numeric', precision: 10, scale: 2 })
  distanceKm: number;

  @Column({ name: 'ESTIMATED_HOURS', type: 'numeric', precision: 10, scale: 2 })
  estimatedHours: number;

  @Column({ name: 'IS_INTERNATIONAL', type: 'boolean', default: false })
  isInternational: boolean;

  @Column({ name: 'IS_ACTIVE', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ContractRoute, (contractRoute) => contractRoute.route)
  contractRoutes: ContractRoute[];
}
