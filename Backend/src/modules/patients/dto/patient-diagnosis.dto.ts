import { IsDateString, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

/** Entrée diagnostic CIM-10 (format code proche OMS / CIM-10). */
export class PatientDiagnosisDto {
  @IsString()
  @Matches(/^[A-TV-Z]\d{2}(\.[A-TV-Z0-9]{1,4})?$/, {
    message: 'Code CIM-10 invalide (ex. H25.9, E11)',
  })
  code: string;

  @IsString()
  @MaxLength(500)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @ValidateIf((o: PatientDiagnosisDto) => Boolean(o.recordedAt && String(o.recordedAt).trim()))
  @IsDateString()
  recordedAt?: string;
}
