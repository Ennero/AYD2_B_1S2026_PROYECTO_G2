import { Entity, Column, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InvoiceStatus } from '../../../../domain/enums/invoice-status.enum';
import { CurrencyCode } from '../../../../domain/enums/currency-code.enum';
import { Order } from './order.entity';
import { Client } from './client.entity';
import { Payment } from './payment.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'invoice_id' })
  invoiceId: number;

  @Column({ name: 'invoice_number', type: 'varchar', length: 40, unique: true })
  invoiceNumber: string;

  @Column({ name: 'order_id', type: 'integer', unique: true })
  orderId: number;

  @Column({ name: 'client_id', type: 'integer' })
  clientId: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.BORRADOR })
  status: InvoiceStatus;

  @Column({ name: 'issue_date', type: 'timestamptz', default: () => 'NOW()' })
  issueDate: Date;

  @Column({ name: 'certified_at', type: 'timestamptz', nullable: true })
  certifiedAt: Date | null;

  @Column({ name: 'due_date', type: 'date', default: () => "(CURRENT_DATE + INTERVAL '30 day')::DATE" })
  dueDate: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'client_name', type: 'varchar', length: 180 })
  clientName: string;

  @Column({ name: 'client_nit', type: 'varchar', length: 20 })
  clientNit: string;

  @Column({ name: 'client_address', type: 'text' })
  clientAddress: string;

  @Column({ name: 'service_description', type: 'text' })
  serviceDescription: string;

  @Column({
    name: 'currency_code',
    type: 'enum',
    enum: CurrencyCode,
    default: CurrencyCode.GTQ,
  })
  currencyCode: CurrencyCode;

  @Column({
    name: 'exchange_rate_from_usd',
    type: 'numeric',
    precision: 14,
    scale: 6,
    default: 1,
  })
  exchangeRateFromUsd: number;

  @Column({
    name: 'tax_rate',
    type: 'numeric',
    precision: 5,
    scale: 4,
    default: 0.12,
  })
  taxRate: number;

  @Column({ name: 'subtotal_amount', type: 'numeric', precision: 14, scale: 2 })
  subtotalAmount: number;

  @Column({ name: 'tax_amount', type: 'numeric', precision: 14, scale: 2 })
  taxAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 14, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'fel_uuid',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true })
  felUuid: string | null;

  @Column({ name: 'pdf_path', type: 'text', nullable: true })
  pdfPath: string | null;

  @ManyToOne(() => Order, (order) => order.invoices)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Client, (client) => client.invoices)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}
