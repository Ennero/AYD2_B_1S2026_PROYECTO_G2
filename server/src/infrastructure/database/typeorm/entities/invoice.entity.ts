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

@Entity('INVOICES')
export class Invoice {
  @PrimaryGeneratedColumn('uuid', { name: 'INVOICE_ID' })
  invoiceId: string;

  @Column({ name: 'INVOICE_NUMBER', type: 'varchar', length: 40, unique: true })
  invoiceNumber: string;

  @Column({ name: 'ORDER_ID', type: 'uuid', unique: true })
  orderId: string;

  @Column({ name: 'CLIENT_ID', type: 'uuid' })
  clientId: string;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.BORRADOR,
  })
  status: InvoiceStatus;

  @Column({ name: 'ISSUE_DATE', type: 'timestamptz' })
  issueDate: Date;

  @Column({ name: 'DUE_DATE', type: 'date' })
  dueDate: string;

  @Column({ name: 'SENT_AT', type: 'timestamptz', nullable: true })
  sentAt: Date;

  @Column({ name: 'CLIENT_NAME', type: 'varchar', length: 180 })
  clientName: string;

  @Column({ name: 'CLIENT_NIT', type: 'varchar', length: 20 })
  clientNit: string;

  @Column({ name: 'CLIENT_ADDRESS', type: 'text' })
  clientAddress: string;

  @Column({ name: 'SERVICE_DESCRIPTION', type: 'text' })
  serviceDescription: string;

  @Column({ name: 'SUBTOTAL_AMOUNT', type: 'numeric', precision: 14, scale: 2 })
  subtotalAmount: number;

  @Column({ name: 'TAX_AMOUNT', type: 'numeric', precision: 14, scale: 2 })
  taxAmount: number;

  @Column({ name: 'TOTAL_AMOUNT', type: 'numeric', precision: 14, scale: 2 })
  totalAmount: number;

  @Column({
    name: 'FEL_UUID',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  felUuid: string;

  @Column({ name: 'PDF_PATH', type: 'text', nullable: true })
  pdfPath: string;

  @ManyToOne(() => Order, (order) => order.invoices)
  @JoinColumn({ name: 'ORDER_ID' })
  order: Order;

  @ManyToOne(() => Client, (client) => client.invoices)
  @JoinColumn({ name: 'CLIENT_ID' })
  client: Client;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}
