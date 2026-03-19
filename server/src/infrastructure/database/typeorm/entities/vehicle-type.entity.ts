import { PrimaryColumn,  Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ContractRate } from './contract-rate.entity';
import { TransportUnit } from './transport-unit.entity';

@Entity('vehicle_types')
export class VehicleType {
  @PrimaryGeneratedColumn({ type: 'smallint', name: 'vehicle_type_id' })
  vehicleTypeId: number;

  @Column({ name: 'type_code', type: 'varchar', length: 20, unique: true })
  typeCode: string;

  @Column({ name: 'type_name', type: 'varchar', length: 100, unique: true })
  typeName: string;

  @Column({ name: 'min_capacity_ton', type: 'numeric', precision: 6, scale: 2 })
  minCapacityTon: number;

  @Column({
    name: 'max_capacity_ton',
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true })
  maxCapacityTon: number;

  @Column({ name: 'rate_per_km', type: 'numeric', precision: 12, scale: 2 })
  ratePerKm: number;

  @OneToMany(() => ContractRate, (rate) => rate.vehicleType)
  contractRates: ContractRate[];

  @OneToMany(() => TransportUnit, (unit) => unit.vehicleType)
  transportUnits: TransportUnit[];
}
