import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  ValidateNested,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { RegisterPatientProfileDto } from '@/modules/patients/dto/register-patient-profile.dto';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ValidateIf((o: CreateUserDto) => o.role === UserRole.patient)
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterPatientProfileDto)
  patientProfile?: RegisterPatientProfileDto;

  @IsOptional()
  @IsIn(['fr', 'ar', 'en'])
  lang?: 'fr' | 'ar' | 'en';
}
