import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ContractStatus } from '../../../../domain/enums/contract-status.enum';
import { Client } from './client.entity';
import { ContractRoute } from './contract-route.entity';
import { ContractRate } from './contract-rate.entity';
import { CargoType } from './cargo-type.entity';
import { Order } from './order.entity';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid', { name: 'contract_id' })
  contractId: string;

  @Column({
    name: 'contract_number',
    type: 'varchar',
    length: 40,
    unique: true,
  })
  contractNumber: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.BORRADOR,
  })
  status: ContractStatus;

  @Column({ name: 'start_date', type: 'date', default: () => 'CURRENT_DATE' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', default: () => "(CURRENT_DATE + INTERVAL '1 year')::DATE" })
  endDate: string;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ name: 'credit_limit', type: 'numeric', precision: 14, scale: 2 })
  creditLimit: number;

  @Column({ name: 'payment_term_days', type: 'smallint' })
  paymentTermDays: number;

  @Column({
    name: 'discount_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercentage: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Client, (client) => client.contracts)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => ContractRoute, (route) => route.contract)
  contractRoutes: ContractRoute[];

  @OneToMany(() => ContractRate, (rate) => rate.contract)
  contractRates: ContractRate[];

  @OneToMany(() => Order, (order) => order.contract)
  orders: Order[];

  @ManyToMany(() => CargoType, (cargoType) => cargoType.contracts)
  @JoinTable({
    name: 'contract_cargo_types',
    joinColumn: { name: 'contract_id', referencedColumnName: 'contractId' },
    inverseJoinColumn: {
      name: 'cargo_type_id',
      referencedColumnName: 'cargoTypeId',
    },
  })
  cargoTypes: CargoType[];
}
