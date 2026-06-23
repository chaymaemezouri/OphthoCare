import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { AppointmentType, AppointmentVisitKind } from '@prisma/client';

export class CreateAppointmentDto {
  @IsString()
  doctorId!: string;

  /** Cabinet / lieu de consultation (défaut : site principal du praticien si absent). */
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsEnum(AppointmentVisitKind)
  visitKind?: AppointmentVisitKind;

  @IsOptional()
  @IsString()
  familyMemberId?: string;

  @IsOptional()
  @IsString()
  preConsultationFormId?: string;

  /** Réservé à la secrétaire : créer un RDV pour un patient du cabinet. */
  @IsOptional()
  @IsString()
  patientId?: string;

  /** Date locale (YYYY-MM-DD) utilisée pour valider le créneau contre la grille de disponibilité */
  @IsOptional()
  @IsDateString()
  slotDate?: string;
}