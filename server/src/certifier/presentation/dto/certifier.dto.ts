import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateNitDto {
  @IsString()
  @IsNotEmpty()
  clientNit: string;
}

export class CertifyInvoiceDto {
  @IsString()
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
