import { IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  userId: string;

  @IsString()
  @MaxLength(64)
  specialtyCode: string;

  @IsString()
  @MaxLength(120)
  city: string;

  @IsString()
  @MaxLength(200)
  street: string;

  @IsString()
  @MaxLength(32)
  postalCode: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  licenseNumber?: string;

  @IsOptional()
  @IsObject()
  workingHours?: Record<string, unknown>;
}
