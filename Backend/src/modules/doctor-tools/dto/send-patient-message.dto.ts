import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendPatientMessageDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body!: string;
}
