import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';
import { ClientFactory } from '../factories/client.factory';

export interface CreateClientInput {
  legalName: string;
  commercialName?: string;
  nit: string;
  taxAddress: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  creditLimit?: number;
  paymentRisk?: RiskLevel;
  customsRisk?: RiskLevel;
  cargoRisk?: RiskLevel;
  amlRisk?: RiskLevel;
}

export interface CreateClientOutput {
  clientId: string;
  clientCode: string;
  legalName: string;
  nit: string;
  primaryContactEmail: string;
}

@Injectable()
export class CreateClientUseCase {
  constructor(private readonly dataSource: DataSource, private readonly clientFactory: ClientFactory) {}

  async execute(input: CreateClientInput): Promise<CreateClientOutput> {
    const nit = input.nit.trim();

    if (!/^\d{13}$/.test(nit)) {
      throw new BadRequestException('El NIT debe contener exactamente 13 digitos.');
    }

    if (input.creditLimit !== undefined && input.creditLimit < 0) {
      throw new BadRequestException('El limite de credito no puede ser negativo.');
    }

    const repository = this.dataSource.getRepository(Client);

    const existingClient = await repository.findOne({ where: { nit } });
    if (existingClient) {
      throw new BadRequestException(`Ya existe un cliente con NIT ${nit}.`);
    }

    const client = this.clientFactory.create({
      ...input,
      nit,
    });

    const savedClient = await repository.save(client);

    return {
      clientId: savedClient.clientId,
      clientCode: savedClient.clientCode,
      legalName: savedClient.legalName,
      nit: savedClient.nit,
      primaryContactEmail: savedClient.primaryContactEmail,
    };
  }
}
