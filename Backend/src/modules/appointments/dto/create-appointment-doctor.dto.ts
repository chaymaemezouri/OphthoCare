import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppointmentType, AppointmentVisitKind } from '@prisma/client';

export class CreateAppointmentDoctorDto {
  @IsString()
  patientId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsEnum(AppointmentVisitKind)
  visitKind?: AppointmentVisitKind;
}
