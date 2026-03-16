import { IsUUID, IsNumber, IsBoolean, Min } from 'class-validator';

export class FormalizeCargaDto {
  @IsUUID()
  orderId: string;

  @IsNumber()
  @Min(0.01)
  loadedWeightTon: number;

  @IsBoolean()
  stowageConfirmed: boolean;
}
