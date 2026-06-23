import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClinicalRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  narrative?: string;

  @IsOptional()
  @IsObject()
  structuredData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeSummary?: string;
}
