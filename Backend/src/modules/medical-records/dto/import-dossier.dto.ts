import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { PatientDiagnosisDto } from '@/modules/patients/dto/patient-diagnosis.dto';

export class ImportDossierDto {
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

  /** Si true, crée aussi une entrée MedicalRecord « Import » pour la traçabilité clinique */
  @IsOptional()
  @IsBoolean()
  createClinicalTrace?: boolean;
}
