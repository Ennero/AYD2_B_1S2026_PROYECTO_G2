import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail, MinLength, Matches } from 'class-validator';
import { RiskLevel } from '../../../domain/enums/risk-level.enum';

const PHONE_PATTERN = /^\+50[234]\d{8}$/;

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
  @IsEmail()
  primaryContactEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  portalPassword: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE_PATTERN, {
    message: 'primaryContactPhone debe tener el formato +502/+503/+504 seguido de 8 dígitos.',
  })
  primaryContactPhone?: string;

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
