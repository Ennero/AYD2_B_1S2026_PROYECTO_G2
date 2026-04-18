import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Client } from './client.entity';

@Entity('client_contacts')
@Index(['clientId', 'contactEmail'], { unique: true })
export class ClientContact {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'contact_id' })
  contactId: number;

  @Column({ name: 'client_id', type: 'integer' })
  clientId: number;

  @Column({ name: 'contact_name', type: 'varchar', length: 160 })
  contactName: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 320 })
  contactEmail: string;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  contactPhone: string | null;

  @Column({
    name: 'position_title',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  positionTitle: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => Client, (client) => client.contacts)
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
