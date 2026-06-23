import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

const FIELD_TYPES = [
  'text',
  'number',
  'select',
  'date',
  'boolean',
  'range',
  'multiselect',
] as const;

export class SpecialtyFieldDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsIn([...FIELD_TYPES])
  type!: (typeof FIELD_TYPES)[number];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;
}
