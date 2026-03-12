import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserRole } from '../../domain/enums/user-role.enum';

export interface CreateUserDto {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  clientId?: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash: dto.passwordHash,
      role: dto.role,
      phone: dto.phone,
      clientId: dto.clientId,
      isActive: true,
    });

    return user;
  }
}
