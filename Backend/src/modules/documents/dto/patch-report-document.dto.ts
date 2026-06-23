import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClinicalReportDocumentType } from '@prisma/client';

export class PatchReportDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(ClinicalReportDocumentType)
  reportType?: ClinicalReportDocumentType;
}
