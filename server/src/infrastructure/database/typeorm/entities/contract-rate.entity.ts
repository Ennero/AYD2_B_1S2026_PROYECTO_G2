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

@Entity('CONTRACT_RATES')
@Index(['contractId', 'vehicleTypeId'], { unique: true })
export class ContractRate {
  @PrimaryGeneratedColumn('uuid', { name: 'CONTRACT_RATE_ID' })
  contractRateId: string;

  @Column({ name: 'CONTRACT_ID', type: 'uuid' })
  contractId: string;

  @Column({ name: 'VEHICLE_TYPE_ID', type: 'smallint' })
  vehicleTypeId: number;

  @Column({
    name: 'BASE_RATE_PER_KM',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  baseRatePerKm: number;

  @Column({
    name: 'DISCOUNT_PERCENTAGE',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountPercentage: number;

  @Column({
    name: 'FINAL_RATE_PER_KM',
    type: 'numeric',
    precision: 12,
    scale: 2,
  })
  finalRatePerKm: number;

  @ManyToOne(() => Contract, (contract) => contract.contractRates)
  @JoinColumn({ name: 'CONTRACT_ID' })
  contract: Contract;

  @ManyToOne(() => VehicleType, (vehicleType) => vehicleType.contractRates)
  @JoinColumn({ name: 'VEHICLE_TYPE_ID' })
  vehicleType: VehicleType;

  @OneToMany(() => Order, (order) => order.contractRate)
  orders: Order[];
}
