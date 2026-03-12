import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from './branch.entity';
import { VehicleType } from './vehicle-type.entity';
import { User } from './user.entity';
import { Order } from './order.entity';

@Entity('TRANSPORT_UNITS')
export class TransportUnit {
  @PrimaryGeneratedColumn('uuid', { name: 'UNIT_ID' })
  unitId: string;

  @Column({ name: 'BRANCH_ID', type: 'smallint' })
  branchId: number;

  @Column({ name: 'VEHICLE_TYPE_ID', type: 'smallint' })
  vehicleTypeId: number;

  @Column({ name: 'PILOT_USER_ID', type: 'uuid', unique: true, nullable: true })
  pilotUserId: string;

  @Column({ name: 'PLATE_NUMBER', type: 'varchar', length: 20, unique: true })
  plateNumber: string;

  @Column({
    name: 'VEHICLE_MODEL',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  vehicleModel: string;

  @Column({ name: 'CAPACITY_TON', type: 'numeric', precision: 6, scale: 2 })
  capacityTon: number;

  @Column({ name: 'HAS_REFRIGERATION', type: 'boolean', default: false })
  hasRefrigeration: boolean;

  @Column({
    name: 'PILOT_LICENSE_NUMBER',
    type: 'varchar',
    length: 40,
    unique: true,
  })
  pilotLicenseNumber: string;

  @Column({ name: 'PILOT_LICENSE_EXPIRATION', type: 'date' })
  pilotLicenseExpiration: string;

  @Column({ name: 'VEHICLE_DOCUMENT_EXPIRATION', type: 'date' })
  vehicleDocumentExpiration: string;

  @Column({ name: 'IS_ACTIVE', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Branch, (branch) => branch.transportUnits)
  @JoinColumn({ name: 'BRANCH_ID' })
  branch: Branch;

  @ManyToOne(() => VehicleType, (type) => type.transportUnits)
  @JoinColumn({ name: 'VEHICLE_TYPE_ID' })
  vehicleType: VehicleType;

  @ManyToOne(() => User, (user) => user.transportUnits)
  @JoinColumn({ name: 'PILOT_USER_ID' })
  pilotUser: User;

  @OneToMany(() => Order, (order) => order.unit)
  orders: Order[];
}
