import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateRouteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  routeCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  origin: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  destination: string;

  @IsNumber()
  distanceKm: number;

  @IsNumber()
  estimatedHours: number;

  @IsBoolean()
  isInternational: boolean;
}
