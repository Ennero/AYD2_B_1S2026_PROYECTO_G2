import { RiskLevel } from '../../../domain/enums/risk-level.enum';

export class CreateClientDto {
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
