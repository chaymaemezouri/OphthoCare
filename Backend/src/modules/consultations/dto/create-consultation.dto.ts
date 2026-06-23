import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateConsultationDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  specialtyCode?: string;
}
