import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { ContractRoute } from './contract-route.entity';

@Entity('routes')
@Index(['origin', 'destination'], { unique: true })
export class Route {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'route_id' })
  routeId: number;

  @Column({ name: 'route_code', type: 'varchar', length: 30, unique: true })
  routeCode: string;

  @Column({ name: 'origin', type: 'varchar', length: 120 })
  origin: string;

  @Column({ name: 'destination', type: 'varchar', length: 120 })
  destination: string;

  @Column({ name: 'distance_km', type: 'numeric', precision: 10, scale: 2 })
  distanceKm: number;

  @Column({ name: 'estimated_hours', type: 'numeric', precision: 10, scale: 2 })
  estimatedHours: number;

  @Column({ name: 'is_international', type: 'boolean', default: false })
  isInternational: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => ContractRoute, (contractRoute) => contractRoute.route)
  contractRoutes: ContractRoute[];
}
