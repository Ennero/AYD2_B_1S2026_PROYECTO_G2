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

@Entity('CONTRACTS')
export class Contract {
  @PrimaryGeneratedColumn('uuid', { name: 'CONTRACT_ID' })
  contractId: string;

  @Column({
    name: 'CONTRACT_NUMBER',
    type: 'varchar',
    length: 40,
    unique: true,
  })
  contractNumber: string;

  @Column({ name: 'CLIENT_ID', type: 'uuid' })
  clientId: string;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.BORRADOR,
  })
  status: ContractStatus;

  @Column({ name: 'START_DATE', type: 'date', default: () => 'CURRENT_DATE' })
  startDate: string;

  @Column({ name: 'END_DATE', type: 'date' })
  endDate: string;

  @Column({ name: 'ACCEPTED_AT', type: 'timestamptz', nullable: true })
  acceptedAt: Date;

  @Column({ name: 'CREDIT_LIMIT', type: 'numeric', precision: 14, scale: 2 })
  creditLimit: number;

  @Column({ name: 'PAYMENT_TERM_DAYS', type: 'smallint' })
  paymentTermDays: number;

  @Column({
    name: 'DISCOUNT_PERCENTAGE',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercentage: number;

  @Column({ name: 'SIGNED_CONTRACT_PATH', type: 'text', nullable: true })
  signedContractPath: string;

  @Column({ name: 'NOTES', type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Client, (client) => client.contracts)
  @JoinColumn({ name: 'CLIENT_ID' })
  client: Client;

  @OneToMany(() => ContractRoute, (route) => route.contract)
  contractRoutes: ContractRoute[];

  @OneToMany(() => ContractRate, (rate) => rate.contract)
  contractRates: ContractRate[];

  @OneToMany(() => Order, (order) => order.contract)
  orders: Order[];

  @ManyToMany(() => CargoType, (cargoType) => cargoType.contracts)
  @JoinTable({
    name: 'CONTRACT_CARGO_TYPES',
    joinColumn: { name: 'CONTRACT_ID', referencedColumnName: 'contractId' },
    inverseJoinColumn: {
      name: 'CARGO_TYPE_ID',
      referencedColumnName: 'cargoTypeId',
    },
  })
  cargoTypes: CargoType[];
}
