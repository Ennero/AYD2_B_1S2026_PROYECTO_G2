import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsUUID,
} from 'class-validator';

export class CertifierSummaryQueryDto {
  @IsOptional()
  @IsIn(['MONTHLY'])
  period?: 'MONTHLY';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class ValidateNitDto {
  @IsString()
  @IsNotEmpty()
  clientNit: string;
}

export class CertifyInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  felUuid: string;

  @IsString()
  @IsNotEmpty()
  clientNit: string;
}

export class RejectInvoiceDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
