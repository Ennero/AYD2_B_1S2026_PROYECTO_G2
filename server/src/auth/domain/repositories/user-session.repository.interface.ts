import { UserSession } from '../../../infrastructure/database/typeorm/entities/user-session.entity';

export interface CreateSessionData {
  userId: string;
  userRemote: string | null;
  userAgent: string | null;
  sessionUuid: string;
  sessionToken: string;
  sessionSource: string;
  expirationAt: Date;
}

export interface IUserSessionRepository {
  create(data: CreateSessionData): Promise<UserSession>;
  findActiveByToken(sessionToken: string): Promise<UserSession | null>;
  findActiveBySessionUuid(sessionUuid: string): Promise<UserSession | null>;
  softDelete(sessionId: string): Promise<void>;
  incrementUsage(sessionId: string): Promise<void>;
}

export const USER_SESSION_REPOSITORY_TOKEN = Symbol('IUserSessionRepository');
