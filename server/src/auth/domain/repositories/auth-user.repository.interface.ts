import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';

export interface IAuthUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  updatePassword(userId: number, passwordHash: string): Promise<void>;
}

export const AUTH_USER_REPOSITORY_TOKEN = Symbol('IAuthUserRepository');
