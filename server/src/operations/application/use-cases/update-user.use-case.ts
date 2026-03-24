import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateUserOutput {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  role: UserRole;
  clientId: number | null;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(userId: number, input: UpdateUserInput): Promise<UpdateUserOutput> {
    const repository = this.dataSource.getRepository(User);

    const user = await repository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException(`Usuario ${userId} no encontrado.`);
    }

    const hasChanges =
      input.fullName !== undefined ||
      input.email !== undefined ||
      input.phone !== undefined ||
      input.isActive !== undefined;

    if (!hasChanges) {
      throw new BadRequestException('No se enviaron cambios para actualizar el usuario.');
    }

    if (input.email !== undefined) {
      const normalizedEmail = input.email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new BadRequestException('El correo no puede estar vacío.');
      }

      const existing = await repository.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.userId !== user.userId) {
        throw new BadRequestException(`Ya existe otro usuario con el correo ${normalizedEmail}.`);
      }

      user.email = normalizedEmail;
    }

    if (input.fullName !== undefined) {
      const normalizedName = input.fullName.trim();
      if (!normalizedName) {
        throw new BadRequestException('El nombre no puede estar vacío.');
      }
      user.fullName = normalizedName;
    }

    if (input.phone !== undefined) {
      const normalizedPhone = input.phone.trim();
      user.phone = normalizedPhone.length > 0 ? normalizedPhone : null;
    }

    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
    }

    const saved = await repository.save(user);

    return {
      userId: Number(saved.userId),
      fullName: saved.fullName,
      email: saved.email,
      phone: saved.phone,
      isActive: saved.isActive,
      role: saved.role,
      clientId: saved.clientId ?? null,
    };
  }
}
