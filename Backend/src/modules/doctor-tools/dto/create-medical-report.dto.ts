import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMedicalReportDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  specialtyCode?: string;
}
