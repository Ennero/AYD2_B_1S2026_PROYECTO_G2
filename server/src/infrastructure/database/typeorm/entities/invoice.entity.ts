import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { InvoiceStatus } from '../../../../domain/enums/invoice-status.enum';
import { Order } from './order.entity';
import { Client } from './client.entity';
import { Payment } from './payment.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid', { name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 40, unique: true })
  invoiceNumber: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.BORRADOR,
  })
  status: InvoiceStatus;

  @Column({ name: 'issue_date', type: 'timestamptz' })
  issueDate: Date;

  @Column({ name: 'certified_at', type: 'timestamptz', nullable: true })
  certifiedAt: Date | null;

  @Column({ name: 'due_date', type: 'date' })
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
    nullable: true,
  })
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
