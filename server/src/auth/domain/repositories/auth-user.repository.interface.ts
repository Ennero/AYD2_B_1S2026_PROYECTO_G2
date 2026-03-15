import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';

export interface IAuthUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

export const AUTH_USER_REPOSITORY_TOKEN = Symbol('IAuthUserRepository');
