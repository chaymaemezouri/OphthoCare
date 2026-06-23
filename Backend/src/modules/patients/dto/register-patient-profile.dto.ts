import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PatientDiagnosisDto } from './patient-diagnosis.dto';
import { FamilyMemberDto } from './family-member.dto';
import { EmergencyContactDto } from './emergency-contact.dto';

/** Données patient optionnelles à l’inscription (complétées ensuite sur le profil). */
export class RegisterPatientProfileDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nationalId?: string;

  @IsOptional()
  @IsObject()
  medicalData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  insuranceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cnssAffiliation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  amoRightsNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  mutuelleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mutuelleContractNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  coverageNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  insuranceCoverage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  bloodType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antecedents?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatientDiagnosisDto)
  diagnoses?: PatientDiagnosisDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FamilyMemberDto)
  familyMembers?: FamilyMemberDto[];
}
