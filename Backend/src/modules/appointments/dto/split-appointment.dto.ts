import { IsDateString } from 'class-validator';

export class SplitAppointmentDto {
  /** Heure locale/ISO entre start et end du RDV d’origine — fin du premier segment = début du second */
  @IsDateString()
  splitAt!: string;
}
