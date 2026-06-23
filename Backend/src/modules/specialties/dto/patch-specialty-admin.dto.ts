import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SpecialtyFieldDto } from './specialty-field.dto';

export class PatchSpecialtyAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialtyFieldDto)
  specificFields?: SpecialtyFieldDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  examTypes?: string[];
}
