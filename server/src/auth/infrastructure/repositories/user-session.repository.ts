import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { UserSession } from '../../../infrastructure/database/typeorm/entities/user-session.entity';
import {
  CreateSessionData,
  IUserSessionRepository,
} from '../../domain/repositories/user-session.repository.interface';

@Injectable()
export class UserSessionRepository implements IUserSessionRepository {
  constructor(
    @InjectRepository(UserSession)
    private readonly repo: Repository<UserSession>,
  ) {}

  async create(data: CreateSessionData): Promise<UserSession> {
    const session = this.repo.create({
      userId: data.userId,
      userUuid: String(data.userId),
      userRemote: data.userRemote,
      userAgent: data.userAgent,
      sessionUuid: data.sessionUuid,
      sessionToken: data.sessionToken,
      sessionSource: data.sessionSource,
      expirationAt: data.expirationAt,
      usageCount: 0,
    });
    return this.repo.save(session);
  }

  findActiveByToken(sessionToken: string): Promise<UserSession | null> {
    return this.repo.findOne({
      where: {
        sessionToken,
        deletedAt: IsNull(),
        expirationAt: MoreThan(new Date()),
      },
    });
  }

  findActiveBySessionUuid(sessionUuid: string): Promise<UserSession | null> {
    return this.repo.findOne({
      where: {
        sessionUuid,
        deletedAt: IsNull(),
        expirationAt: MoreThan(new Date()),
      },
    });
  }

  async softDelete(sessionId: number): Promise<void> {
    await this.repo.update({ sessionId }, { deletedAt: new Date() });
  }

  async incrementUsage(sessionId: number): Promise<void> {
    await this.repo.increment({ sessionId }, 'usageCount', 1);
    await this.repo.update({ sessionId }, { lastUsedAt: new Date() });
  }
}
