import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateConsultationDto {
  @IsOptional()
  @IsObject()
  structuredData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  prescriptionIds?: string[];
}
