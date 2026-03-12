import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('PASSWORD_RECOVERY_TOKENS')
export class PasswordRecoveryToken {
  @PrimaryGeneratedColumn('uuid', { name: 'TOKEN_ID' })
  tokenId: string;

  @Column({ name: 'USER_ID', type: 'uuid' })
  userId: string;

  @Column({ name: 'TOKEN_HASH', type: 'text', unique: true })
  tokenHash: string;

  @Column({ name: 'EXPIRES_AT', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'USED_AT', type: 'timestamptz', nullable: true })
  usedAt: Date;

  @ManyToOne(() => User, (user) => user.recoveryTokens)
  @JoinColumn({ name: 'USER_ID' })
  user: User;
}
