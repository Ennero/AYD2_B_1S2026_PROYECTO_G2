import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentMethod } from '../../../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../../../domain/enums/payment-status.enum';
import { Invoice } from './invoice.entity';
import { ClientCard } from './client-card.entity';
import { User } from './user.entity';

@Entity('PAYMENTS')
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'PAYMENT_ID' })
  paymentId: string;

  @Column({ name: 'INVOICE_ID', type: 'uuid' })
  invoiceId: string;

  @Column({ name: 'METHOD', type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDIENTE,
  })
  status: PaymentStatus;

  @Column({ name: 'CARD_ID', type: 'uuid', nullable: true })
  cardId: string;

  @Column({
    name: 'BANK_REFERENCE',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  bankReference: string;

  @Column({ name: 'TRANSFER_RECEIPT_PATH', type: 'text', nullable: true })
  transferReceiptPath: string;

  @Column({ name: 'AMOUNT', type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'PAYMENT_DATE', type: 'timestamptz' })
  paymentDate: Date;

  @Column({ name: 'REVIEWED_BY_USER_ID', type: 'uuid', nullable: true })
  reviewedByUserId: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'INVOICE_ID' })
  invoice: Invoice;

  @ManyToOne(() => ClientCard, (card) => card.payments)
  @JoinColumn({ name: 'CARD_ID' })
  card: ClientCard;

  @ManyToOne(() => User, (user) => user.paymentsReviewed)
  @JoinColumn({ name: 'REVIEWED_BY_USER_ID' })
  reviewedByUser: User;
}
