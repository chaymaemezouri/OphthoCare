import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ScheduleBlockKind } from '@prisma/client';

export class CreateScheduleBlockDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsEnum(ScheduleBlockKind)
  kind?: ScheduleBlockKind;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  /** Si renseigné, le blocage ne s’applique qu’à ce site (sinon tout le praticien). */
  @IsOptional()
  @IsString()
  doctorSiteId?: string;
}