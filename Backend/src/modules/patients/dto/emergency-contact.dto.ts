import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EmergencyContactDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(80)
  relation!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;
}
