import { Entity, Column, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../../../domain/enums/user-role.enum';
import { Client } from './client.entity';
import { PasswordRecoveryToken } from './password-recovery-token.entity';
import { Order } from './order.entity';
import { Payment } from './payment.entity';
import { TransportUnit } from './transport-unit.entity';
import { UserSession } from './user-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'user_id' })
  userId: number;

  @Column({ name: 'client_id', type: 'integer', nullable: true })
  clientId: number | null;

  @Column({ name: 'role', type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName: string;

  @Column({ name: 'email', type: 'varchar', length: 320, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => Client, (client) => client.users, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => PasswordRecoveryToken, (token) => token.user)
  recoveryTokens: PasswordRecoveryToken[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToMany(() => Order, (order) => order.requestedByUser)
  ordersRequested: Order[];

  @OneToMany(() => Payment, (payment) => payment.reviewedByUser)
  paymentsReviewed: Payment[];

  @OneToMany(() => TransportUnit, (unit) => unit.pilotUser)
  transportUnits: TransportUnit[];
}
