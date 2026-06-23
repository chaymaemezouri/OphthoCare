import { IsOptional, IsString, Matches, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAppointmentSlotsDto {
  @IsString()
  doctorId!: string;

  @IsString()
  siteId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  duration?: number;
}
