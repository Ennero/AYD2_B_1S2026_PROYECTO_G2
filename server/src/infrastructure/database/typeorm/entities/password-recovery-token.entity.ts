import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('password_recovery_tokens')
export class PasswordRecoveryToken {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'token_id' })
  tokenId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

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
