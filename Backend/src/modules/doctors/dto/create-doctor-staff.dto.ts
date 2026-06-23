import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDoctorStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsIn(['secretary', 'trainee'])
  role!: 'secretary' | 'trainee';

  @IsOptional()
  @IsIn(['fr', 'ar', 'en'])
  lang?: 'fr' | 'ar' | 'en';
}
