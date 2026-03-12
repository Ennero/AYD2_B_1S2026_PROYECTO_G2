import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { TransportUnit } from './transport-unit.entity';
import { Order } from './order.entity';

@Entity('BRANCHES')
export class Branch {
  @PrimaryColumn('smallint', { name: 'BRANCH_ID' })
  branchId: number;

  @Column({ name: 'BRANCH_CODE', type: 'varchar', length: 20, unique: true })
  branchCode: string;

  @Column({ name: 'BRANCH_NAME', type: 'varchar', length: 100, unique: true })
  branchName: string;

  @Column({ name: 'CITY', type: 'varchar', length: 100 })
  city: string;

  @Column({ name: 'COUNTRY', type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'IS_ACTIVE', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => TransportUnit, (unit) => unit.branch)
  transportUnits: TransportUnit[];

  @OneToMany(() => Order, (order) => order.branch)
  orders: Order[];
}
