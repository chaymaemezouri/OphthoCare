import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PracticeSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;

  @IsString()
  @MaxLength(160)
  name: string;

  @IsString()
  @MaxLength(200)
  street: string;

  @IsString()
  @MaxLength(120)
  city: string;

  @IsString()
  @MaxLength(32)
  postalCode: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationPrice?: number;

  @IsOptional()
  @IsObject()
  workingHours?: Record<string, string[]>;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
