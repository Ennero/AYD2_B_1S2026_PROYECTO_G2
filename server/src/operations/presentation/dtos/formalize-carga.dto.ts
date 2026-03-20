import { IsString, IsNotEmpty, IsNumber, IsBoolean, Min } from 'class-validator';

export class FormalizeCargaDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @Min(0.01)
  loadedWeightTon: number;

  @IsBoolean()
  stowageConfirmed: boolean;
}
