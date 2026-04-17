import { IsInt, IsNumber, IsOptional, IsPositive, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Tarifa por tipo de vehículo pactada en este contrato específico */
export class ContractRateDto {
  /** ID del tipo de vehículo (vehicle_type_id) */
  @IsInt()
  @IsPositive()
  vehicleTypeId!: number;

  /** Tarifa base por km en la moneda del contrato (currency_code del cliente) */
  @IsNumber()
  @IsPositive()
  baseRatePerKm!: number;

  /** Descuento porcentual sobre la tarifa base (0–100). Default: 0 */
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercentage?: number;
}

export class CreateContractDto {
  @IsInt()
  @IsPositive()
  clientId!: number;

  @IsNumber()
  @IsPositive()
  creditLimit!: number;

  /** Plazo de pago en días — valor libre, sin restricción a opciones fijas */
  @IsInt()
  @IsPositive()
  paymentTermDays!: number;

  @IsNumber()
  @Min(0)
  discountPercentage!: number;

  /** IDs de rutas a incluir en el contrato */
  routeIds!: number[];

  /** IDs de tipos de mercancía permitidos */
  cargoTypeIds!: number[];

  /**
   * Tarifas por tipo de vehículo acordadas en este contrato.
   * Se almacenan en contract_rates usando la moneda del contrato (currencyCode del cliente).
   * Si se omite, el contrato se crea sin tarifas pactadas.
   */
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ContractRateDto)
  rates?: ContractRateDto[];
}
