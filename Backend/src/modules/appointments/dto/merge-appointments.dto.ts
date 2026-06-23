import { IsString } from 'class-validator';

export class MergeAppointmentsDto {
  @IsString()
  keepId!: string;

  @IsString()
  removeId!: string;
}
