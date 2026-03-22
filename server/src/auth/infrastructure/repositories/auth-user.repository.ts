import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { IAuthUserRepository } from '../../domain/repositories/auth-user.repository.interface';

@Injectable()
export class AuthUserRepository implements IAuthUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { userId: id } });
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await this.repo.update({ userId }, { passwordHash });
  }
}
