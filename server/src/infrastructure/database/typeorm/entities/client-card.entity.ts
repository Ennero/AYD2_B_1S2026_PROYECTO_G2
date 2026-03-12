import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Client } from './client.entity';
import { Payment } from './payment.entity';

@Entity('client_cards')
@Index(['clientId', 'cardAlias'], { unique: true })
export class ClientCard {
  @PrimaryGeneratedColumn('uuid', { name: 'card_id' })
  cardId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'card_alias', type: 'varchar', length: 80 })
  cardAlias: string;

  @Column({ name: 'cardholder_name', type: 'varchar', length: 160 })
  cardholderName: string;

  @Column({ name: 'card_brand', type: 'varchar', length: 30 })
  cardBrand: string;

  @Column({ name: 'last_four', type: 'char', length: 4 })
  lastFour: string;

  @Column({ name: 'expiration_month', type: 'smallint' })
  expirationMonth: number;

  @Column({ name: 'expiration_year', type: 'smallint' })
  expirationYear: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Client, (client) => client.cards)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Payment, (payment) => payment.card)
  payments: Payment[];
}
