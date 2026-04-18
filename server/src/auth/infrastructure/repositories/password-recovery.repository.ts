import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { PasswordRecoveryToken } from '../../../infrastructure/database/typeorm/entities/password-recovery-token.entity';
import {
  CreateRecoveryData,
  IPasswordRecoveryRepository,
} from '../../domain/repositories/password-recovery.repository.interface';

@Injectable()
export class PasswordRecoveryRepository implements IPasswordRecoveryRepository {
  constructor(
    @InjectRepository(PasswordRecoveryToken)
    private readonly repo: Repository<PasswordRecoveryToken>,
  ) {}

  async create(data: CreateRecoveryData): Promise<PasswordRecoveryToken> {
    const token = this.repo.create({
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    });
    return this.repo.save(token);
  }

  findValidByTokenHash(
    tokenHash: string,
  ): Promise<PasswordRecoveryToken | null> {
    return this.repo.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async markAsUsed(tokenId: number): Promise<void> {
    await this.repo.update({ tokenId }, { usedAt: new Date() });
  }
}
