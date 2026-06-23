import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateReferralLetterDto {
  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  recipientName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientSpecialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recipientAddress?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  body!: string;
}
