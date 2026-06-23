import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionDocumentType } from '@prisma/client';

export class MedicationLineDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsEnum(PrescriptionDocumentType)
  type?: PrescriptionDocumentType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationLineDto)
  medications!: MedicationLineDto[];
}
