import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  legalName: string;

  @IsString()
  @IsNotEmpty()
  nit: string;

  @IsString()
  @IsNotEmpty()
  taxAddress: string;

  @IsString()
  @IsNotEmpty()
  primaryContactName: string;

  @IsString()
  @IsNotEmpty()
  primaryContactEmail: string;

  @IsString()
  @IsOptional()
  primaryContactPhone?: string;

  @IsOptional()
  creditLimit?: number;

  @IsEnum(RiskLevel)
  @IsOptional()
  paymentRisk?: RiskLevel;

  @IsEnum(RiskLevel)
  @IsOptional()
  customsRisk?: RiskLevel;

  @IsEnum(RiskLevel)
  @IsOptional()
  cargoRisk?: RiskLevel;

  @IsEnum(RiskLevel)
  @IsOptional()
  amlRisk?: RiskLevel;
}
