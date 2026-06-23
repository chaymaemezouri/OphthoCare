import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ReceiptNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /** Format YYYY-NNNNN, compteur atomique par cabinet et année. */
  async nextSequentialNumber(doctorSpaceId: string, year = new Date().getFullYear()): Promise<string> {
    const seq = await this.prisma.$transaction(async (tx) => {
      const row = await tx.doctorSpaceReceiptCounter.upsert({
        where: { doctorSpaceId_year: { doctorSpaceId, year } },
        create: { doctorSpaceId, year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      return row.lastNumber;
    });
    return `${year}-${String(seq).padStart(5, '0')}`;
  }
}
