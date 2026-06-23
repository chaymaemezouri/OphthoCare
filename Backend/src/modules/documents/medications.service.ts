import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MedicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, limit = 20) {
    const term = q.trim();
    if (term.length < 2) return [];
    const rows = await this.prisma.medication.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { genericName: { contains: term, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      genericName: r.genericName,
      form: r.form,
      dosages: r.dosages,
    }));
  }
}
