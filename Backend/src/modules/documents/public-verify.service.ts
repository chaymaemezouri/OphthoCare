import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export type VerifyDocType = 'prescription' | 'receipt' | 'report';

@Injectable()
export class PublicVerifyService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(type: VerifyDocType, uuid: string) {
    if (type === 'prescription') {
      const row = await this.prisma.prescription.findFirst({
        where: { verificationUuid: uuid },
        include: { doctor: { include: { user: true } } },
      });
      if (!row) throw new NotFoundException();
      return this.ok(row.createdAt, row.doctor.user);
    }
    if (type === 'receipt') {
      const row = await this.prisma.paymentReceipt.findFirst({
        where: { verificationUuid: uuid },
        include: { doctor: { include: { user: true } } },
      });
      if (!row) throw new NotFoundException();
      return this.ok(row.createdAt, row.doctor.user);
    }
    const row = await this.prisma.medicalReport.findFirst({
      where: { verificationUuid: uuid },
      include: { doctor: { include: { user: true } } },
    });
    if (!row) throw new NotFoundException();
    return this.ok(row.createdAt, row.doctor.user);
  }

  private ok(
    documentDate: Date,
    user: { firstName: string | null; lastName: string | null } | null,
  ) {
    const doctorName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Médecin';
    return {
      isValid: true,
      doctorName: `Dr ${doctorName}`,
      documentDate: documentDate.toISOString(),
    };
  }
}
