import { IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';

const PHONE_PATTERN = /^\+50[234]\d{8}$/;

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(PHONE_PATTERN, {
    message: 'phone debe tener el formato +502/+503/+504 seguido de 8 dígitos.',
  })
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
