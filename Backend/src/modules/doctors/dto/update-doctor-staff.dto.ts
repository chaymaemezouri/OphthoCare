import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDoctorStaffDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
