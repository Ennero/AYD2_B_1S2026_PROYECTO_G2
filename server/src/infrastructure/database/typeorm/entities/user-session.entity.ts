import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'session_id' })
  sessionId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'user_remote', type: 'inet', nullable: true })
  userRemote: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ name: 'user_uuid', type: 'varchar', length: 36 })
  userUuid: string;

  @Column({ name: 'session_uuid', type: 'varchar', length: 36, unique: true })
  sessionUuid: string;

  @Column({ name: 'session_token', type: 'text', unique: true })
  sessionToken: string;

  @Column({ name: 'session_source', type: 'varchar', length: 80 })
  sessionSource: string;

  @Column({ name: 'usage_count', type: 'integer', default: 0 })
  usageCount: number;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'expiration_at', type: 'timestamptz' })
  expirationAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user: User;
}