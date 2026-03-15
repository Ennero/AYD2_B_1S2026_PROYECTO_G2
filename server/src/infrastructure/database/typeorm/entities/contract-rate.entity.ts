import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Contract } from './contract.entity';
import { VehicleType } from './vehicle-type.entity';
import { Order } from './order.entity';

@Entity('contract_rates')
@Index(['contractId', 'vehicleTypeId'], { unique: true })
@Index(['contractRateId', 'contractId'], { unique: true })
export class ContractRate {
  @PrimaryGeneratedColumn('uuid', { name: 'contract_rate_id' })
  contractRateId: string;

  @Column({ name: 'contract_id', type: 'uuid' })
  contractId: string;

  @Column({ name: 'vehicle_type_id', type: 'smallint' })
  vehicleTypeId: number;

  @Column({
    name: 'base_rate_per_km',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  baseRatePerKm: number;

  @Column({
    name: 'discount_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercentage: number;

  @Column({
    name: 'final_rate_per_km',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  finalRatePerKm: number;

  @ManyToOne(() => Contract, (contract) => contract.contractRates)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => VehicleType, (vehicleType) => vehicleType.contractRates)
  @JoinColumn({ name: 'vehicle_type_id' })
  vehicleType: VehicleType;

  @OneToMany(() => Order, (order) => order.contractRate)
  orders: Order[];
}
