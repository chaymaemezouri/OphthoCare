import { IsDateString, IsString, MaxLength } from 'class-validator';

export class PatientConsentDto {
  @IsString()
  @MaxLength(80)
  type!: string;

  @IsDateString()
  signedAt!: string;
}
