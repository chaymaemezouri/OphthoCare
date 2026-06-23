import { IsOptional, IsString } from 'class-validator';

export class ModerateReviewDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
