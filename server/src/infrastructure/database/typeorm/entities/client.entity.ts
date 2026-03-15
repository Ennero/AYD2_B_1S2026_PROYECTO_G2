import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Check } from 'typeorm';
import { RiskLevel } from '../../../../domain/enums/risk-level.enum';
import { User } from './user.entity';
import { ClientContact } from './client-contact.entity';
import { ClientCard } from './client-card.entity';
import { Contract } from './contract.entity';
import { Invoice } from './invoice.entity';

@Entity('clients')
@Check("nit ~ '^[0-9]{13}$'")
export class Client {
  @PrimaryGeneratedColumn('uuid', { name: 'client_id' })
  clientId: string;

  @Column({ name: 'client_code', type: 'varchar', length: 30, unique: true })
  clientCode: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 180 })
  legalName: string;

  @Column({ name: 'commercial_name', type: 'varchar', length: 180, nullable: true })
  commercialName: string | null;

  @Column({ name: 'nit', type: 'varchar', length: 20, unique: true })
  nit: string;

  @Column({ name: 'tax_address', type: 'text' })
  taxAddress: string;

  @Column({ name: 'primary_contact_name', type: 'varchar', length: 160 })
  primaryContactName: string;

  @Column({ name: 'primary_contact_email', type: 'varchar', length: 320 })
  primaryContactEmail: string;

  @Column({
    name: 'primary_contact_phone',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  primaryContactPhone: string | null;

  @Column({ name: 'credit_limit', type: 'numeric', precision: 14, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ name: 'payment_risk', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  paymentRisk: RiskLevel;

  @Column({ name: 'customs_risk', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  customsRisk: RiskLevel;

  @Column({ name: 'cargo_risk', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  cargoRisk: RiskLevel;

  @Column({ name: 'aml_risk', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIO })
  amlRisk: RiskLevel;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason: string | null;

  // Relations
  @OneToMany(() => User, (user) => user.client)
  users: User[];

  @OneToMany(() => ClientContact, (contact) => contact.client)
  contacts: ClientContact[];

  @OneToMany(() => ClientCard, (card) => card.client)
  cards: ClientCard[];

  @OneToMany(() => Contract, (contract) => contract.client)
  contracts: Contract[];

  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices: Invoice[];
}
