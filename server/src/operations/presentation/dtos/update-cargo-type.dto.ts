import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCargoTypeDto {
  @IsString()
  @IsNotEmpty()
  cargoName: string;

  @IsBoolean()
  requiresRefrigeration: boolean;
}
