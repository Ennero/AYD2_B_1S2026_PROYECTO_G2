import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethod } from '../../../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../../../domain/enums/payment-status.enum';
import { CurrencyCode } from '../../../../domain/enums/currency-code.enum';
import { Invoice } from './invoice.entity';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'payment_id' })
  paymentId: number;

  @Column({ name: 'invoice_id', type: 'integer' })
  invoiceId: number;

  @Column({ name: 'method', type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDIENTE,
  })
  status: PaymentStatus;

  @Column({ name: 'support_document_path', type: 'text', nullable: true })
  supportDocumentPath: string | null;

  @Column({
    name: 'currency_code',
    type: 'enum',
    enum: CurrencyCode,
    default: CurrencyCode.GTQ,
  })
  currencyCode: CurrencyCode;

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'payment_date', type: 'timestamptz', default: () => 'NOW()' })
  paymentDate: Date;

  @Column({ name: 'reviewed_by_user_id', type: 'integer', nullable: true })
  reviewedByUserId: number | null;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => User, (user) => user.paymentsReviewed)
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedByUser: User;
}
