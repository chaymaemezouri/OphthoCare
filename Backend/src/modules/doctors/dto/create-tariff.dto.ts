import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTariffDto {
  @IsString()
  doctorSiteId!: string;

  @IsString()
  @MaxLength(80)
  actType!: string;

  @IsString()
  @MaxLength(200)
  label!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
