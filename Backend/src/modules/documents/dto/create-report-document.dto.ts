import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClinicalReportDocumentType } from '@prisma/client';

export class CreateReportDocumentDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsEnum(ClinicalReportDocumentType)
  reportType?: ClinicalReportDocumentType;

  @IsOptional()
  @IsString()
  specialtyCode?: string;
}
