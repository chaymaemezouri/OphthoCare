import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReschedulePatientAppointmentDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  /** Date locale YYYY-MM-DD pour validation grille (défaut : jour de startTime). */
  @IsOptional()
  @IsString()
  slotDate?: string;
}
