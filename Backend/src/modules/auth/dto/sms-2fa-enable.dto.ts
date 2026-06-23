import { IsString, Length } from 'class-validator';

export class Sms2faEnableDto {
  @IsString()
  @Length(6, 6)
  code: string;
}
