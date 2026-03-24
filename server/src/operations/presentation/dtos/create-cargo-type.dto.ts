import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCargoTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cargoName: string;

  @IsBoolean()
  requiresRefrigeration: boolean;
}
