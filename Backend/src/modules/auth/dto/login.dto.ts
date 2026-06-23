import { IsEmail, IsString, MinLength, IsOptional, ValidateIf, Length } from 'class-validator';

export class LoginDto {
  @ValidateIf((o: LoginDto) => !o.pendingToken)
  @IsEmail()
  email?: string;

  @ValidateIf((o: LoginDto) => !o.pendingToken)
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  pendingToken?: string;

  @ValidateIf((o: LoginDto) => !!o.pendingToken)
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;
}
