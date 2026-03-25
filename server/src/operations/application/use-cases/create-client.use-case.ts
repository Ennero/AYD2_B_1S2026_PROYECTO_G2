import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';
import { User } from '../../../infrastructure/database/typeorm/entities/user.entity';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { ClientFactory } from '../factories/client.factory';
import { EmailService } from '../../../notifications/email/application/email.service';

export interface CreateClientInput {
  legalName: string;
  nit: string;
  taxAddress: string;
  primaryContactName: string;
  primaryContactEmail: string;
  portalPassword: string;
  primaryContactPhone?: string;
  paymentRisk?: RiskLevel;
  customsRisk?: RiskLevel;
  cargoRisk?: RiskLevel;
  amlRisk?: RiskLevel;
}

export interface CreateClientOutput {
  clientId: number;
  clientCode: string;
  legalName: string;
  nit: string;
  primaryContactEmail: string;
  portalUserEmail: string;
}

@Injectable()
export class CreateClientUseCase {
  private readonly logger = new Logger(CreateClientUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly clientFactory: ClientFactory,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: CreateClientInput): Promise<CreateClientOutput> {
    const nit = input.nit.trim();
    const normalizedEmail = input.primaryContactEmail.trim().toLowerCase();
    const portalPassword = input.portalPassword?.trim();

    if (!/^\d{13}$/.test(nit)) {
      throw new BadRequestException('El NIT debe contener exactamente 13 digitos.');
    }

    if (!portalPassword || portalPassword.length < 12) {
      throw new BadRequestException('La contraseña de acceso debe tener al menos 12 caracteres.');
    }

    const clientRepository = this.dataSource.getRepository(Client);
    const userRepository = this.dataSource.getRepository(User);

    const existingClient = await clientRepository.findOne({ where: { nit } });
    if (existingClient) {
      throw new BadRequestException(`Ya existe un cliente con NIT ${nit}.`);
    }

    const existingUser = await userRepository.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new BadRequestException(`Ya existe un usuario con el correo ${normalizedEmail}.`);
    }

    const client = this.clientFactory.create({
      legalName: input.legalName,
      nit,
      taxAddress: input.taxAddress,
      primaryContactName: input.primaryContactName,
      primaryContactEmail: normalizedEmail,
      primaryContactPhone: input.primaryContactPhone,
      paymentRisk: input.paymentRisk,
      customsRisk: input.customsRisk,
      cargoRisk: input.cargoRisk,
      amlRisk: input.amlRisk,
    });

    const { savedClient } = await this.dataSource.transaction(async (manager) => {
      const savedClient = await manager.getRepository(Client).save(client);

      const passwordHash = await bcrypt.hash(portalPassword, 10);
      const portalUser = manager.getRepository(User).create({
        clientId: Number(savedClient.clientId),
        role: UserRole.CLIENTE,
        fullName: `${savedClient.primaryContactName} Portal`,
        email: normalizedEmail,
        passwordHash,
        phone: savedClient.primaryContactPhone,
        isActive: true,
      });

      await manager.getRepository(User).save(portalUser);

      return { savedClient };
    });

    this.emailService
      .sendWelcome({
        to: normalizedEmail,
        clientName: client.legalName,
        email: normalizedEmail,
        temporaryPassword: portalPassword,
      })
      .catch((err: Error) =>
        this.logger.error(
          `Error al enviar credenciales de acceso a ${normalizedEmail}: ${err.message}`,
        ),
      );

    return {
      clientId: Number(savedClient.clientId),
      clientCode: savedClient.clientCode,
      legalName: savedClient.legalName,
      nit: savedClient.nit,
      primaryContactEmail: savedClient.primaryContactEmail,
      portalUserEmail: normalizedEmail,
    };
  }
}
