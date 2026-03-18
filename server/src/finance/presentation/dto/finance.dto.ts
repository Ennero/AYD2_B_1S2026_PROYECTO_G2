import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';

export class FinanceSummaryQueryDto {
  @IsOptional()
  @IsIn(['MONTHLY'])
  period?: 'MONTHLY';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month?: number;
}

export class FinanceInvoicesQueryDto {
  @IsOptional()
  @IsIn([
    InvoiceStatus.BORRADOR,
    InvoiceStatus.CERTIFICADA,
    InvoiceStatus.ENVIADA,
    InvoiceStatus.PAGADA,
    InvoiceStatus.RECHAZADA,
  ])
  status?: InvoiceStatus;
}

export class FinancePaymentsQueryDto {
  @IsOptional()
  @IsIn([PaymentStatus.PENDIENTE, PaymentStatus.APROBADO, PaymentStatus.RECHAZADO])
  status?: PaymentStatus;
}

export class SendInvoiceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pdfPath?: string;
}

export class UpdateRateDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  ratePerKm: number;
}
