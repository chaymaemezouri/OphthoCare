import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { PatientDiagnosisDto } from './patient-diagnosis.dto';

export class UpdatePatientDossierDto {
  @IsOptional()
  @IsObject()
  medicalData?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatientDiagnosisDto)
  diagnoses?: PatientDiagnosisDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;
}
