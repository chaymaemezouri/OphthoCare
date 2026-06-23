import { IsString, MinLength } from 'class-validator';

export class SuspendDoctorDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
