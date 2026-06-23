import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMedicalImageDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  examType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
