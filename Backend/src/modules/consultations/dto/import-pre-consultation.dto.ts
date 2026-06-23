import { IsUUID } from 'class-validator';

export class ImportPreConsultationDto {
  @IsUUID()
  preFormId!: string;
}
