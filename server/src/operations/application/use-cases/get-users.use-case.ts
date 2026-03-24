import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';

export interface OperationUserItem {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  role: UserRole;
  clientId: number | null;
  clientCode: string | null;
  clientName: string | null;
}

@Injectable()
export class GetUsersUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(search?: string, role?: UserRole): Promise<OperationUserItem[]> {
    const queryBuilder = this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.client', 'client');

    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      queryBuilder.andWhere(
        'user.fullName ILIKE :q OR user.email ILIKE :q OR client.legalName ILIKE :q OR client.nit ILIKE :q',
        { q },
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    const users = await queryBuilder
      .orderBy('user.isActive', 'DESC')
      .addOrderBy('user.fullName', 'ASC')
      .getMany();

    return users.map((user) => ({
      userId: Number(user.userId),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      role: user.role,
      clientId: user.clientId ?? null,
      clientCode: user.client?.clientCode ?? null,
      clientName: user.client?.legalName ?? null,
    }));
  }
}
