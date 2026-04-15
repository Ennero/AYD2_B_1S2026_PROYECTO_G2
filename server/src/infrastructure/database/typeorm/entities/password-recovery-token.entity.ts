import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('password_recovery_tokens')
export class PasswordRecoveryToken {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'token_id' })
  tokenId: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => User, (user) => user.recoveryTokens)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
