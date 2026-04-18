import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CountryCode } from '../../../../domain/enums/country-code.enum';
import { CurrencyCode } from '../../../../domain/enums/currency-code.enum';
import { RiskLevel } from '../../../../domain/enums/risk-level.enum';
import { User } from './user.entity';
import { ClientContact } from './client-contact.entity';
import { Contract } from './contract.entity';
import { Invoice } from './invoice.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'client_id' })
  clientId: number;

  @Column({ name: 'client_code', type: 'varchar', length: 30, unique: true })
  clientCode: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 180 })
  legalName: string;

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

  @Column({
    name: 'country_code',
    type: 'enum',
    enum: CountryCode,
    default: CountryCode.GT,
  })
  countryCode: CountryCode;

  @Column({
    name: 'currency_code',
    type: 'enum',
    enum: CurrencyCode,
    default: CurrencyCode.GTQ,
  })
  currencyCode: CurrencyCode;

  @Column({
    name: 'tax_rate',
    type: 'numeric',
    precision: 5,
    scale: 4,
    default: 0.12,
  })
  taxRate: number;

  @Column({
    name: 'payment_risk',
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIO,
  })
  paymentRisk: RiskLevel;

  @Column({
    name: 'customs_risk',
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIO,
  })
  customsRisk: RiskLevel;

  @Column({
    name: 'cargo_risk',
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIO,
  })
  cargoRisk: RiskLevel;

  @Column({
    name: 'aml_risk',
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIO,
  })
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

  @OneToMany(() => Contract, (contract) => contract.client)
  contracts: Contract[];

  @OneToMany(() => Invoice, (invoice) => invoice.client)
  invoices: Invoice[];
}
