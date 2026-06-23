import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require('archiver') as typeof import('archiver');
import { PrismaService } from '@/prisma/prisma.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsContextService } from '@/modules/doctor-tools/doctor-tools-context.service';
import { DocumentStorageService } from './document-storage.service';

@Injectable()
export class DocumentsListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: DoctorToolsContextService,
    private readonly storage: DocumentStorageService,
  ) {}

  async listUnified(
    user: RequestUser,
    filters: { patientId?: string; type?: string; from?: string; to?: string },
  ) {
    const spaceId = user.doctorSpaceId;
    if (user.role !== UserRole.doctor && user.role !== UserRole.secretary) {
      throw new ForbiddenException();
    }
    if (!spaceId) throw new ForbiddenException();
    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    const dateFilter = from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};

    const items: Array<{
      id: string;
      kind: 'prescription' | 'report' | 'receipt';
      title: string;
      patientId: string;
      createdAt: string;
      pdfUrl: string | null;
      pdfStatus: string;
    }> = [];

    if (!filters.type || filters.type === 'prescription') {
      const rows = await this.prisma.prescription.findMany({
        where: { doctorSpaceId: spaceId, ...(filters.patientId ? { patientId: filters.patientId } : {}), ...dateFilter },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      items.push(
        ...rows.map((r) => ({
          id: r.id,
          kind: 'prescription' as const,
          title: `Ordonnance ${r.type}`,
          patientId: r.patientId,
          createdAt: r.createdAt.toISOString(),
          pdfUrl: r.pdfUrl,
          pdfStatus: r.pdfStatus,
        })),
      );
    }
    if (!filters.type || filters.type === 'report') {
      const rows = await this.prisma.medicalReport.findMany({
        where: { doctorSpaceId: spaceId, ...(filters.patientId ? { patientId: filters.patientId } : {}), ...dateFilter },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      items.push(
        ...rows.map((r) => ({
          id: r.id,
          kind: 'report' as const,
          title: r.title,
          patientId: r.patientId,
          createdAt: r.createdAt.toISOString(),
          pdfUrl: r.pdfUrl,
          pdfStatus: r.pdfStatus,
        })),
      );
    }
    if (!filters.type || filters.type === 'receipt') {
      const rows = await this.prisma.paymentReceipt.findMany({
        where: { doctorSpaceId: spaceId, ...(filters.patientId ? { patientId: filters.patientId } : {}), ...dateFilter },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      items.push(
        ...rows.map((r) => ({
          id: r.id,
          kind: 'receipt' as const,
          title: `Reçu ${r.sequentialNumber}`,
          patientId: r.patientId,
          createdAt: r.createdAt.toISOString(),
          pdfUrl: r.pdfUrl,
          pdfStatus: r.pdfStatus,
        })),
      );
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items };
  }

  async exportZip(user: RequestUser, patientId?: string) {
    const { doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    if (patientId) await this.ctx.assertPatientAccess(user, patientId);
    const where = { doctorSpaceId, ...(patientId ? { patientId } : {}), pdfStorageKey: { not: null } };
    const [prescriptions, reports, receipts] = await Promise.all([
      this.prisma.prescription.findMany({ where, take: 50 }),
      this.prisma.medicalReport.findMany({ where, take: 50 }),
      this.prisma.paymentReceipt.findMany({ where, take: 50 }),
    ]);
    return new Promise<{ buffer: Buffer; filename: string }>((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];
      archive.on('data', (c: Buffer) => chunks.push(c));
      archive.on('end', () =>
        resolve({ buffer: Buffer.concat(chunks), filename: `documents-${Date.now()}.zip` }),
      );
      archive.on('error', reject);
      const append = async (kind: string, id: string, key: string | null, name: string) => {
        if (!key) return;
        try {
          const buf = await this.storage.readPdf(key);
          archive.append(buf, { name: `${kind}/${name}-${id}.pdf` });
        } catch {
          /* skip missing */
        }
      };
      void (async () => {
        for (const p of prescriptions) await append('ordonnances', p.id, p.pdfStorageKey, p.type);
        for (const r of reports) await append('comptes-rendus', r.id, r.pdfStorageKey, 'cr');
        for (const r of receipts) await append('recus', r.id, r.pdfStorageKey, r.sequentialNumber);
        await archive.finalize();
      })();
    });
  }
}
