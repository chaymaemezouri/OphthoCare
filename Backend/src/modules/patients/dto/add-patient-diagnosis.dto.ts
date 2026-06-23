import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddPatientDiagnosisDto {
  @IsString()
  @MaxLength(32)
  code!: string;

  @IsString()
  @MaxLength(500)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
