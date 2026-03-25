import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateClientProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AcceptContractDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  creditLimit: number;
}

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  contractId: number;

  @IsInt()
  @Min(1)
  cargoTypeId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  pickupAddress: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  deliveryAddress: string;

  @IsNotEmpty()
  declaredWeightTon: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cargoDescription?: string;
}

export class CreateContactDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  contactName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(320)
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  positionTitle?: string;
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  positionTitle?: string;
}

export class RegisterPaymentDto {
  @IsInt()
  @Min(1)
  invoiceId: number;

  @IsNotEmpty()
  @IsIn(['TRANSFERENCIA', 'CHEQUE'])
  method: 'TRANSFERENCIA' | 'CHEQUE';

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  bankName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  bankAccountNumber: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  bankReference: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  supportDocumentPath: string;
}
