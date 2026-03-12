import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RiskLevel } from '../../../../domain/enums/risk-level.enum';
import { User } from './user.entity';
import { ClientCard } from './client-card.entity';
import { Contract } from './contract.entity';
import { Invoice } from './invoice.entity';

@Entity('CLIENTS')
export class Client {
  @PrimaryGeneratedColumn('uuid', { name: 'CLIENT_ID' })
  clientId: string;

  @Column({ name: 'CLIENT_CODE', type: 'varchar', length: 30, unique: true })
  clientCode: string;

  @Column({ name: 'LEGAL_NAME', type: 'varchar', length: 180 })
  legalName: string;

  @Column({ name: 'COMMERCIAL_NAME', type: 'varchar', length: 180, nullable: true })
  commercialName: string;

  @Column({ name: 'NIT', type: 'varchar', length: 20, unique: true })
  nit: string;

  @Column({ name: 'TAX_ADDRESS', type: 'text' })
  taxAddress: string;

  @Column({ name: 'CONTACT_NAME', type: 'varchar', length: 160 })
  contactName: string;

  @Column({ name: 'CONTACT_EMAIL', type: 'varchar', length: 320 })
  contactEmail: string;

  @Column({ name: 'CONTACT_PHONE', type: 'varchar', length: 30, nullable: true })
  contactPhone: string;

  @Column({ name: 'CREDIT_LIMIT', type: 'numeric', precision: 14, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ name: 'PAYMENT_RISK', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  paymentRisk: RiskLevel;

  @Column({ name: 'CUSTOMS_RISK', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  customsRisk: RiskLevel;

  @Column({ name: 'CARGO_RISK', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  cargoRisk: RiskLevel;

  @Column({ name: 'AML_RISK', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  amlRisk: RiskLevel;

  @Column({ name: 'IS_BLOCKED', type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ name: 'BLOCK_REASON', type: 'text', nullable: true })
  blockReason: string;

  // Relations
  @OneToMany(() => User, (user) => user.client)
  users: User[];

  @OneToMany(() => ClientCard, (card) => card.client)
  cards: ClientCard[];

  @OneToMany(() => Contract, (contract) => contract.client)
  contracts: Contract[];

  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices: Invoice[];
}
