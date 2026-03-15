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

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  paymentId: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @Column({ name: 'method', type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDIENTE,
  })
  status: PaymentStatus;

  @Column({ name: 'card_id', type: 'uuid', nullable: true })
  cardId: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 120, nullable: true })
  bankName: string | null;

  @Column({
    name: 'bank_account_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  bankAccountNumber: string | null;

  @Column({
    name: 'bank_reference',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  bankReference: string | null;

  @Column({ name: 'support_document_path', type: 'text', nullable: true })
  supportDocumentPath: string | null;

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2 })
  amount: number;

  @Column({ name: 'payment_date', type: 'timestamptz', default: () => 'NOW()' })
  paymentDate: Date;

  @Column({ name: 'reviewed_by_user_id', type: 'uuid', nullable: true })
  reviewedByUserId: string | null;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ManyToOne(() => ClientCard, (card) => card.payments)
  @JoinColumn({ name: 'card_id' })
  card: ClientCard;

  @ManyToOne(() => User, (user) => user.paymentsReviewed)
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedByUser: User;
}
