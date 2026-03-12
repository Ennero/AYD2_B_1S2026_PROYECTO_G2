import { Entity, PrimaryColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Contract } from './contract.entity';
import { Order } from './order.entity';

@Entity('CARGO_TYPES')
export class CargoType {
  @PrimaryColumn('smallint', { name: 'CARGO_TYPE_ID' })
  cargoTypeId: number;

  @Column({ name: 'CARGO_NAME', type: 'varchar', length: 100, unique: true })
  cargoName: string;

  @Column({ name: 'REQUIRES_REFRIGERATION', type: 'boolean', default: false })
  requiresRefrigeration: boolean;

  @ManyToMany(() => Contract, (contract) => contract.cargoTypes)
  contracts: Contract[];

  @OneToMany(() => Order, (order) => order.cargoType)
  orders: Order[];
}
