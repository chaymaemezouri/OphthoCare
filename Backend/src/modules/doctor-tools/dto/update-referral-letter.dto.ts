import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateReferralLetterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientSpecialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recipientAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  body?: string;
}
