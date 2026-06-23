import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PlatformAuditAction } from '@prisma/client';
import { Transform } from 'class-transformer';

export class AuditLogsQueryDto {
  @IsOptional()
  @IsEnum(PlatformAuditAction)
  action?: PlatformAuditAction;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(String(value), 10) : 1))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(String(value), 10) : 50))
  take?: number;
}
