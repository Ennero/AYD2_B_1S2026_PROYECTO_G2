import {
  IsIn,
  IsInt,
  IsNotEmpty,
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

export class AddCardDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  cardAlias: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(160)
  cardholderName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  cardBrand: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(4)
  lastFour: string;

  @IsInt()
  @Min(1)
  @Max(12)
  expirationMonth: number;

  @IsInt()
  @Min(2024)
  @Max(2099)
  expirationYear: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  contractId: string;

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
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @IsNotEmpty()
  @IsIn(['TARJETA', 'TRANSFERENCIA'])
  method: 'TARJETA' | 'TRANSFERENCIA';

  /** Requerido si method = TARJETA */
  @IsOptional()
  @IsString()
  cardId?: string;

  /** Requerido si method = TRANSFERENCIA */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bankReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;
}
