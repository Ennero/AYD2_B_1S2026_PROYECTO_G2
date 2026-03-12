import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';
import { Contract } from './contract.entity';
import { User } from './user.entity';
import { Branch } from './branch.entity';
import { ContractRoute } from './contract-route.entity';
import { ContractRate } from './contract-rate.entity';
import { CargoType } from './cargo-type.entity';
import { TransportUnit } from './transport-unit.entity';
import { OrderRouteLog } from './order-route-log.entity';
import { Invoice } from './invoice.entity';

@Entity('ORDERS')
export class Order {
  @PrimaryGeneratedColumn('uuid', { name: 'ORDER_ID' })
  orderId: string;

  @Column({ name: 'ORDER_NUMBER', type: 'varchar', length: 40, unique: true })
  orderNumber: string;

  @Column({ name: 'CONTRACT_ID', type: 'uuid' })
  contractId: string;

  @Column({ name: 'REQUESTED_BY_USER_ID', type: 'uuid' })
  requestedByUserId: string;

  @Column({ name: 'BRANCH_ID', type: 'smallint', nullable: true })
  branchId: number;

  @Column({ name: 'CONTRACT_ROUTE_ID', type: 'uuid', nullable: true })
  contractRouteId: string;

  @Column({ name: 'CONTRACT_RATE_ID', type: 'uuid', nullable: true })
  contractRateId: string;

  @Column({ name: 'CARGO_TYPE_ID', type: 'smallint' })
  cargoTypeId: number;

  @Column({ name: 'UNIT_ID', type: 'uuid', nullable: true })
  unitId: string;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.REGISTRADA,
  })
  status: OrderStatus;

  @Column({
    name: 'CARGO_DESCRIPTION',
    type: 'text',
    default: 'PENDIENTE_DETALLE',
  })
  cargoDescription: string;

  @Column({
    name: 'DECLARED_WEIGHT_TON',
    type: 'numeric',
    precision: 8,
    scale: 2,
  })
  declaredWeightTon: number;

  @Column({
    name: 'LOADED_WEIGHT_TON',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  loadedWeightTon: number;

  @Column({ name: 'ORIGIN', type: 'text', nullable: true })
  origin: string;

  @Column({ name: 'DESTINATION', type: 'text', nullable: true })
  destination: string;

  @Column({ name: 'PICKUP_ADDRESS', type: 'text' })
  pickupAddress: string;

  @Column({ name: 'DELIVERY_ADDRESS', type: 'text' })
  deliveryAddress: string;

  @Column({ name: 'REQUESTED_AT', type: 'timestamptz' })
  requestedAt: Date;

  @Column({ name: 'SCHEDULED_PICKUP_AT', type: 'timestamptz', nullable: true })
  scheduledPickupAt: Date;

  @Column({ name: 'PROMISED_DELIVERY_AT', type: 'timestamptz', nullable: true })
  promisedDeliveryAt: Date;

  @Column({ name: 'DISPATCHED_AT', type: 'timestamptz', nullable: true })
  dispatchedAt: Date;

  @Column({ name: 'DELIVERED_AT', type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'STOWAGE_CONFIRMED', type: 'boolean', nullable: true })
  stowageConfirmed: boolean;

  @Column({ name: 'IS_SEALED', type: 'boolean', nullable: true })
  isSealed: boolean;

  @Column({
    name: 'RECEIVER_NAME',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  receiverName: string;

  @Column({ name: 'RECEIVER_SIGNATURE_PATH', type: 'text', nullable: true })
  receiverSignaturePath: string;

  @Column({ name: 'DELIVERY_EVIDENCE_PATH', type: 'text', nullable: true })
  deliveryEvidencePath: string;

  @Column({
    name: 'DISTANCE_KM',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  distanceKm: number;

  @Column({
    name: 'BASE_RATE_PER_KM',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
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
    default: 0,
  })
  finalRatePerKm: number;

  @Column({
    name: 'SUBTOTAL_AMOUNT',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  subtotalAmount: number;

  @Column({
    name: 'TAX_AMOUNT',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'TOTAL_AMOUNT',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({
    name: 'FUEL_COST',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  fuelCost: number;

  @Column({
    name: 'VIATICS_COST',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  viaticsCost: number;

  @Column({
    name: 'MAINTENANCE_COST',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0,
  })
  maintenanceCost: number;

  @Column({ name: 'NOTES', type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Contract, (contract) => contract.orders)
  @JoinColumn({ name: 'CONTRACT_ID' })
  contract: Contract;

  @ManyToOne(() => User, (user) => user.ordersRequested)
  @JoinColumn({ name: 'REQUESTED_BY_USER_ID' })
  requestedByUser: User;

  @ManyToOne(() => Branch, (branch) => branch.orders)
  @JoinColumn({ name: 'BRANCH_ID' })
  branch: Branch;

  @ManyToOne(() => ContractRoute, (route) => route.orders)
  @JoinColumn({ name: 'CONTRACT_ROUTE_ID' })
  contractRoute: ContractRoute;

  @ManyToOne(() => ContractRate, (rate) => rate.orders)
  @JoinColumn({ name: 'CONTRACT_RATE_ID' })
  contractRate: ContractRate;

  @ManyToOne(() => CargoType, (type) => type.orders)
  @JoinColumn({ name: 'CARGO_TYPE_ID' })
  cargoType: CargoType;

  @ManyToOne(() => TransportUnit, (unit) => unit.orders)
  @JoinColumn({ name: 'UNIT_ID' })
  unit: TransportUnit;

  @OneToMany(() => OrderRouteLog, (log) => log.order)
  logs: OrderRouteLog[];

  @OneToMany(() => Invoice, (invoice) => invoice.order)
  invoices: Invoice[];
}
