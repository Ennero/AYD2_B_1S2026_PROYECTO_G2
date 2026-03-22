import { Entity, Column, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'order_id' })
  orderId: number;

  @Column({ name: 'order_number', type: 'varchar', length: 40, unique: true })
  orderNumber: string;

  @Column({ name: 'contract_id', type: 'integer' })
  contractId: number;

  @Column({ name: 'requested_by_user_id', type: 'integer' })
  requestedByUserId: number;

  @Column({ name: 'branch_id', type: 'smallint', nullable: true })
  branchId: number | null;

  @Column({ name: 'contract_route_id', type: 'integer', nullable: true })
  contractRouteId: number | null;

  @Column({ name: 'contract_rate_id', type: 'integer', nullable: true })
  contractRateId: number | null;

  @Column({ name: 'cargo_type_id', type: 'smallint' })
  cargoTypeId: number;

  @Column({ name: 'unit_id', type: 'integer', nullable: true })
  unitId: number | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.REGISTRADA })
  status: OrderStatus;

  @Column({
    name: 'cargo_description',
    type: 'text',
    default: 'PENDIENTE_DETALLE' })
  cargoDescription: string;

  @Column({
    name: 'declared_weight_ton',
    type: 'numeric',
    precision: 8,
    scale: 2 })
  declaredWeightTon: number;

  @Column({
    name: 'loaded_weight_ton',
    type: 'numeric',
    precision: 8,
    scale: 2,
    nullable: true })
  loadedWeightTon: number | null;

  @Column({ name: 'origin', type: 'text', nullable: true })
  origin: string | null;

  @Column({ name: 'destination', type: 'text', nullable: true })
  destination: string | null;

  @Column({ name: 'pickup_address', type: 'text' })
  pickupAddress: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  @Column({ name: 'requested_at', type: 'timestamptz', default: () => 'NOW()' })
  requestedAt: Date;

  @Column({ name: 'scheduled_pickup_at', type: 'timestamptz', nullable: true })
  scheduledPickupAt: Date | null;

  @Column({ name: 'promised_delivery_at', type: 'timestamptz', nullable: true })
  promisedDeliveryAt: Date | null;

  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'stowage_confirmed', type: 'boolean', nullable: true })
  stowageConfirmed: boolean | null;

  @Column({ name: 'is_sealed', type: 'boolean', nullable: true })
  isSealed: boolean | null;

  @Column({
    name: 'receiver_name',
    type: 'varchar',
    length: 160,
    nullable: true })
  receiverName: string | null;

  @Column({ name: 'receiver_signature_path', type: 'text', nullable: true })
  receiverSignaturePath: string | null;

  @Column({ name: 'delivery_evidence_path', type: 'text', nullable: true })
  deliveryEvidencePath: string | null;

  @Column({
    name: 'distance_km',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0 })
  distanceKm: number;

  @Column({
    name: 'base_rate_per_km',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0 })
  baseRatePerKm: number;

  @Column({
    name: 'discount_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0 })
  discountPercentage: number;

  @Column({
    name: 'final_rate_per_km',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0 })
  finalRatePerKm: number;

  @Column({
    name: 'subtotal_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0 })
  subtotalAmount: number;

  @Column({
    name: 'tax_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0 })
  taxAmount: number;

  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0 })
  totalAmount: number;

  @Column({
    name: 'fuel_cost',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0 })
  fuelCost: number;

  @Column({
    name: 'viatics_cost',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0 })
  viaticsCost: number;

  @Column({
    name: 'maintenance_cost',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0 })
  maintenanceCost: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Contract, (contract) => contract.orders)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => User, (user) => user.ordersRequested)
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: User;

  @ManyToOne(() => Branch, (branch) => branch.orders)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => ContractRoute, (route) => route.orders)
  @JoinColumn({ name: 'contract_route_id' })
  contractRoute: ContractRoute;

  @ManyToOne(() => ContractRate, (rate) => rate.orders)
  @JoinColumn({ name: 'contract_rate_id' })
  contractRate: ContractRate;

  @ManyToOne(() => CargoType, (type) => type.orders)
  @JoinColumn({ name: 'cargo_type_id' })
  cargoType: CargoType;

  @ManyToOne(() => TransportUnit, (unit) => unit.orders)
  @JoinColumn({ name: 'unit_id' })
  unit: TransportUnit;

  @OneToMany(() => OrderRouteLog, (log) => log.order)
  logs: OrderRouteLog[];

  @OneToMany(() => Invoice, (invoice) => invoice.order)
  invoices: Invoice[];
}
