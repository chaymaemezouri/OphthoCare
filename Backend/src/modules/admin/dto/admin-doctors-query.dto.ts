import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminDoctorsQueryDto {
  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isCertified?: boolean;

  @IsOptional()
  @IsString()
  status?: 'active' | 'suspended' | 'all';

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(String(value), 10) : 0))
  skip?: number;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(String(value), 10) : 50))
  take?: number;
}
