import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateClinicalRecordDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  specialtyCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  narrative?: string;

  @IsObject()
  structuredData!: Record<string, unknown>;
}
