import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserRole } from '../../../../domain/enums/user-role.enum';
import { Client } from './client.entity';
import { PasswordRecoveryToken } from './password-recovery-token.entity';
import { Order } from './order.entity';
import { Payment } from './payment.entity';
import { TransportUnit } from './transport-unit.entity';

@Entity('USERS')
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'USER_ID' })
  userId: string;

  @Column({ name: 'CLIENT_ID', type: 'uuid', nullable: true })
  clientId: string;

  @Column({ name: 'ROLE', type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'FULL_NAME', type: 'varchar', length: 160 })
  fullName: string;

  @Column({ name: 'EMAIL', type: 'varchar', length: 320, unique: true })
  email: string;

  @Column({ name: 'PASSWORD_HASH', type: 'text' })
  passwordHash: string;

  @Column({ name: 'PHONE', type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ name: 'IS_ACTIVE', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => Client, (client) => client.users, { nullable: true })
  @JoinColumn({ name: 'CLIENT_ID' })
  client: Client;

  @OneToMany(() => PasswordRecoveryToken, (token) => token.user)
  recoveryTokens: PasswordRecoveryToken[];

  @OneToMany(() => Order, (order) => order.requestedByUser)
  ordersRequested: Order[];

  @OneToMany(() => Payment, (payment) => payment.reviewedByUser)
  paymentsReviewed: Payment[];

  @OneToMany(() => TransportUnit, (unit) => unit.pilotUser)
  transportUnits: TransportUnit[];
}
