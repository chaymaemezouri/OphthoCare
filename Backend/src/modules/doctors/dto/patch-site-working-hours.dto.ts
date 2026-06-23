import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SiteWorkingHourItemDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PatchSiteWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SiteWorkingHourItemDto)
  hours!: SiteWorkingHourItemDto[];
}
