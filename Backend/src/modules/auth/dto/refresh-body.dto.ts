import { IsOptional, IsString } from 'class-validator';

export class RefreshBodyDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
