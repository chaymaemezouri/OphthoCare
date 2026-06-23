import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMedicalReportDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  specialtyCode?: string;
}
