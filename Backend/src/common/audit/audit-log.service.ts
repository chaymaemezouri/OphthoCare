import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PlatformAuditAction } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export function hashEntityId(entityId: string | null | undefined): string | null {
  if (!entityId?.trim()) return null;
  return createHash('sha256').update(entityId.trim(), 'utf8').digest('hex');
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string | null;
    doctorSpaceId?: string | null;
    action: PlatformAuditAction;
    entityId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.platformAuditLog.create({
        data: {
          userId: params.userId ?? null,
          doctorSpaceId: params.doctorSpaceId ?? null,
          action: params.action,
          entityIdHash: hashEntityId(params.entityId ?? undefined),
          ip: params.ip?.slice(0, 64) ?? null,
          userAgent: params.userAgent?.slice(0, 512) ?? null,
        },
      });
    } catch {
      /* ne pas bloquer le flux métier */
    }
  }
}
