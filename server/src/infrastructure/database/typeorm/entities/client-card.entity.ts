import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Client } from './client.entity';
import { Payment } from './payment.entity';

@Entity('CLIENT_CARDS')
@Index(['clientId', 'cardAlias'], { unique: true })
export class ClientCard {
  @PrimaryGeneratedColumn('uuid', { name: 'CARD_ID' })
  cardId: string;

  @Column({ name: 'CLIENT_ID', type: 'uuid' })
  clientId: string;

  @Column({ name: 'CARD_ALIAS', type: 'varchar', length: 80 })
  cardAlias: string;

  @Column({ name: 'CARD_BRAND', type: 'varchar', length: 30 })
  cardBrand: string;

  @Column({ name: 'LAST_FOUR', type: 'char', length: 4 })
  lastFour: string;

  @Column({ name: 'EXPIRATION_MONTH', type: 'smallint' })
  expirationMonth: number;

  @Column({ name: 'EXPIRATION_YEAR', type: 'smallint' })
  expirationYear: number;

  @Column({ name: 'IS_ACTIVE', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Client, (client) => client.cards)
  @JoinColumn({ name: 'CLIENT_ID' })
  client: Client;

  @OneToMany(() => Payment, (payment) => payment.card)
  payments: Payment[];
}
