import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { VehicleType } from './vehicle-type.entity';
import { User } from './user.entity';
import { Order } from './order.entity';

@Entity('transport_units')
export class TransportUnit {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'unit_id' })
  unitId: number;

  @Column({ name: 'branch_id', type: 'smallint' })
  branchId: number;

  @Column({ name: 'vehicle_type_id', type: 'smallint' })
  vehicleTypeId: number;

  @Column({
    name: 'pilot_user_id',
    type: 'integer',
    unique: true,
    nullable: true,
  })
  pilotUserId: number | null;

  @Column({ name: 'plate_number', type: 'varchar', length: 20, unique: true })
  plateNumber: string;

  @Column({
    name: 'vehicle_model',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  vehicleModel: string | null;

  @Column({ name: 'capacity_ton', type: 'numeric', precision: 6, scale: 2 })
  capacityTon: number;

  @Column({ name: 'has_refrigeration', type: 'boolean', default: false })
  hasRefrigeration: boolean;

  @Column({
    name: 'pilot_license_number',
    type: 'varchar',
    length: 40,
    unique: true,
  })
  pilotLicenseNumber: string;

  @Column({ name: 'pilot_license_expiration', type: 'date' })
  pilotLicenseExpiration: string;

  @Column({ name: 'vehicle_document_expiration', type: 'date' })
  vehicleDocumentExpiration: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @ManyToOne(() => Branch, (branch) => branch.transportUnits)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => VehicleType, (type) => type.transportUnits)
  @JoinColumn({ name: 'vehicle_type_id' })
  vehicleType: VehicleType;

  @ManyToOne(() => User, (user) => user.transportUnits)
  @JoinColumn({ name: 'pilot_user_id' })
  pilotUser: User;

  @OneToMany(() => Order, (order) => order.unit)
  orders: Order[];
}
