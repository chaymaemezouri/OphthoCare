import { IsObject } from 'class-validator';

export class PatientPreConsultationDto {
  @IsObject()
  responses!: Record<string, unknown>;
}
