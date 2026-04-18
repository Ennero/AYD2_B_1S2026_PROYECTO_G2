import {
  PrimaryColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Contract } from './contract.entity';
import { Order } from './order.entity';

@Entity('cargo_types')
export class CargoType {
  @PrimaryGeneratedColumn({ type: 'smallint', name: 'cargo_type_id' })
  cargoTypeId: number;

  @Column({ name: 'cargo_name', type: 'varchar', length: 100, unique: true })
  cargoName: string;

  @Column({ name: 'requires_refrigeration', type: 'boolean', default: false })
  requiresRefrigeration: boolean;

  @ManyToMany(() => Contract, (contract) => contract.cargoTypes)
  contracts: Contract[];

  @OneToMany(() => Order, (order) => order.cargoType)
  orders: Order[];
}
