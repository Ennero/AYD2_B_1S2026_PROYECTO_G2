import { IsNumber, IsBoolean, Min } from 'class-validator';

export class FormalizeCargaDto {
  @IsNumber()
  @Min(0.01)
  loadedWeightTon: number;

  @IsBoolean()
  stowageConfirmed: boolean;
}
