import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';

export interface CreateClientCommand {
  legalName: string;
  commercialName?: string;
  nit: string;
  taxAddress: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  paymentRisk?: RiskLevel;
  customsRisk?: RiskLevel;
  cargoRisk?: RiskLevel;
  amlRisk?: RiskLevel;
}

@Injectable()
export class CreateClientUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateClientCommand) {
    const clientRepo = this.dataSource.getRepository(Client);

    // Verify if NIT already exists
    const existingClient = await clientRepo.findOne({ where: { nit: command.nit } });
    if (existingClient) {
      throw new BadRequestException('Ya existe un cliente con este NIT');
    }

    // Generate a new client code (e.g. CLI-00012)
    const count = await clientRepo.count();
    const clientCode = `CLI-${(count + 1).toString().padStart(5, '0')}`;

    const client = clientRepo.create({
      clientCode,
      legalName: command.legalName,
      commercialName: command.commercialName,
      nit: command.nit,
      taxAddress: command.taxAddress,
      primaryContactName: command.primaryContactName,
      primaryContactEmail: command.primaryContactEmail,
      primaryContactPhone: command.primaryContactPhone,
      paymentRisk: command.paymentRisk ?? RiskLevel.MEDIO,
      customsRisk: command.customsRisk ?? RiskLevel.MEDIO,
      cargoRisk: command.cargoRisk ?? RiskLevel.MEDIO,
      amlRisk: command.amlRisk ?? RiskLevel.MEDIO,
    });

    await clientRepo.save(client);

    return {
      clientId: client.clientId,
      clientCode: client.clientCode,
    };
  }
}
