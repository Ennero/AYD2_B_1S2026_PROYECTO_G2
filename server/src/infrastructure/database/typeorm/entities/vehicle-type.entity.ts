import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { ContractRate } from './contract-rate.entity';
import { TransportUnit } from './transport-unit.entity';

@Entity('VEHICLE_TYPES')
export class VehicleType {
  @PrimaryColumn('smallint', { name: 'VEHICLE_TYPE_ID' })
  vehicleTypeId: number;

  @Column({ name: 'TYPE_CODE', type: 'varchar', length: 20, unique: true })
  typeCode: string;

  @Column({ name: 'TYPE_NAME', type: 'varchar', length: 100, unique: true })
  typeName: string;

  @Column({ name: 'MIN_CAPACITY_TON', type: 'numeric', precision: 6, scale: 2 })
  minCapacityTon: number;

  @Column({
    name: 'MAX_CAPACITY_TON',
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  maxCapacityTon: number;

  @Column({ name: 'RATE_PER_KM', type: 'numeric', precision: 12, scale: 2 })
  ratePerKm: number;

  @OneToMany(() => ContractRate, (rate) => rate.vehicleType)
  contractRates: ContractRate[];

  @OneToMany(() => TransportUnit, (unit) => unit.vehicleType)
  transportUnits: TransportUnit[];
}
