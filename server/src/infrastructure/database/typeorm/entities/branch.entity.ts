import {
  PrimaryColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { TransportUnit } from './transport-unit.entity';
import { Order } from './order.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn({ type: 'smallint', name: 'branch_id' })
  branchId: number;

  @Column({ name: 'branch_code', type: 'varchar', length: 20, unique: true })
  branchCode: string;

  @Column({ name: 'branch_name', type: 'varchar', length: 100, unique: true })
  branchName: string;

  @Column({ name: 'city', type: 'varchar', length: 100 })
  city: string;

  @Column({ name: 'country', type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => TransportUnit, (unit) => unit.branch)
  transportUnits: TransportUnit[];

  @OneToMany(() => Order, (order) => order.branch)
  orders: Order[];
}
