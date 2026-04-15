import { User } from '../../infrastructure/database/typeorm/entities/user.entity';

export interface IUserRepository {
  create(user: Partial<User>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
}

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
