import { Injectable } from '@nestjs/common';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';
import { Client } from '../../../infrastructure/database/typeorm/entities/client.entity';

export interface ClientFactoryInput {
  legalName: string;
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

/**
 * Factory Method para centralizar la construccion de la entidad Client
 * con defaults de negocio coherentes para el alta inicial.
 */
@Injectable()
export class ClientFactory {
  create(input: ClientFactoryInput): Client {
    const client = new Client();

    client.legalName = input.legalName.trim();
    client.nit = input.nit.trim();
    client.taxAddress = input.taxAddress.trim();
    client.primaryContactName = input.primaryContactName.trim();
    client.primaryContactEmail = input.primaryContactEmail.trim().toLowerCase();
    client.primaryContactPhone = this.toNullable(input.primaryContactPhone);

    client.paymentRisk = input.paymentRisk ?? RiskLevel.MEDIO;
    client.customsRisk = input.customsRisk ?? RiskLevel.MEDIO;
    client.cargoRisk = input.cargoRisk ?? RiskLevel.MEDIO;
    client.amlRisk = input.amlRisk ?? RiskLevel.MEDIO;

    client.isBlocked = false;
    client.blockReason = null;

    return client;
  }

  private toNullable(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
