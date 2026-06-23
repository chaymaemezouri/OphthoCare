import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PatientInAppNotificationKind, PdfGenerationStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsContextService } from '@/modules/doctor-tools/doctor-tools-context.service';
import { PatientsService } from '@/modules/patients/patients.service';
import { DocumentPdfService } from './document-pdf.service';
import { DocumentsPdfQueue } from './documents-pdf.queue';
import type { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: DoctorToolsContextService,
    private readonly patients: PatientsService,
    private readonly pdf: DocumentPdfService,
    private readonly pdfQueue: DocumentsPdfQueue,
  ) {}

  private serialize(row: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    doctorId: string;
    doctorSpaceId: string;
    consultationId: string | null;
    type: string;
    medications: unknown;
    pdfUrl: string | null;
    pdfStatus: PdfGenerationStatus;
    verificationUuid: string;
    documentFooterNumber: string | null;
  }) {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      patientId: row.patientId,
      doctorId: row.doctorId,
      doctorSpaceId: row.doctorSpaceId,
      consultationId: row.consultationId,
      type: row.type,
      medications: row.medications,
      pdfUrl: row.pdfUrl,
      pdfStatus: row.pdfStatus,
      verificationUuid: row.verificationUuid,
      documentFooterNumber: row.documentFooterNumber,
    };
  }

  async create(user: RequestUser, dto: CreatePrescriptionDto) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireDoctor(user);
    await this.ctx.assertPatientAccess(user, dto.patientId);
    const footer = `RX-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const row = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        doctorSpaceId,
        consultationId: dto.consultationId ?? null,
        type: dto.type ?? 'STANDARD',
        medications: dto.medications as unknown as Prisma.InputJsonValue,
        documentFooterNumber: footer,
      },
    });
    await this.pdf.enqueueOrGenerate('prescription', row.id, (j) => this.pdfQueue.add(j));
    return this.serialize(row);
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.findReadable(user, id);
    return this.serialize(row);
  }

  async listForPatient(user: RequestUser, patientId: string) {
    await this.assertCanReadPatient(user, patientId);
    const rows = await this.prisma.prescription.findMany({
      where: { patientId, ...(await this.spaceFilter(user)) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.serialize(r));
  }

  async sendToPatient(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    const row = await this.prisma.prescription.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Ordonnance introuvable');
    if (row.pdfStatus !== PdfGenerationStatus.ready || !row.pdfUrl) {
      await this.pdf.generateAndStore('prescription', id);
    }
    const fresh = await this.prisma.prescription.findUnique({ where: { id } });
    await this.patients.pushInAppNotification(row.patientId, {
      kind: PatientInAppNotificationKind.document,
      title: 'Ordonnance disponible',
      body: 'Votre ordonnance PDF est disponible dans Mes documents.',
      linkPath: '/dashboard/patient/documents',
      meta: { prescriptionId: id, pdfUrl: fresh?.pdfUrl },
    });
    return { sent: true, pdfUrl: fresh?.pdfUrl ?? null };
  }

  private async findReadable(user: RequestUser, id: string) {
    const row = await this.prisma.prescription.findFirst({
      where: { id, ...(await this.spaceFilter(user)) },
    });
    if (!row) throw new NotFoundException('Ordonnance introuvable');
    if (user.role === UserRole.patient) {
      const pid = await this.patients.findPatientIdForUser(user.id);
      if (pid !== row.patientId) throw new ForbiddenException();
    }
    return row;
  }

  private async assertCanReadPatient(user: RequestUser, patientId: string) {
    if (user.role === UserRole.patient) {
      const pid = await this.patients.findPatientIdForUser(user.id);
      if (pid !== patientId) throw new ForbiddenException();
      return;
    }
    await this.ctx.assertPatientAccess(user, patientId);
  }

  private async spaceFilter(user: RequestUser) {
    if (user.role === UserRole.patient) return {};
    if (user.role === UserRole.doctor || user.role === UserRole.secretary) {
      if (!user.doctorSpaceId) throw new ForbiddenException();
      return { doctorSpaceId: user.doctorSpaceId };
    }
    throw new ForbiddenException();
  }
}
