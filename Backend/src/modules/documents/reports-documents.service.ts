import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PatientInAppNotificationKind, PdfGenerationStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsContextService } from '@/modules/doctor-tools/doctor-tools-context.service';
import { PatientsService } from '@/modules/patients/patients.service';
import { DocumentPdfService } from './document-pdf.service';
import { DocumentsPdfQueue } from './documents-pdf.queue';
import type { CreateReportDocumentDto } from './dto/create-report-document.dto';
import type { PatchReportDocumentDto } from './dto/patch-report-document.dto';

@Injectable()
export class ReportsDocumentsService {
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
    title: string;
    content: string;
    reportType: string;
    specialtyCode: string | null;
    pdfUrl: string | null;
    pdfStatus: PdfGenerationStatus;
    verificationUuid: string;
    shareToken: string | null;
    sharedAt: Date | null;
    sentToPatientAt: Date | null;
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
      title: row.title,
      content: row.content,
      reportType: row.reportType,
      specialtyCode: row.specialtyCode,
      pdfUrl: row.pdfUrl,
      pdfStatus: row.pdfStatus,
      verificationUuid: row.verificationUuid,
      shareToken: row.shareToken,
      sharedAt: row.sharedAt?.toISOString() ?? null,
      sentToPatientAt: row.sentToPatientAt?.toISOString() ?? null,
      documentFooterNumber: row.documentFooterNumber,
    };
  }

  async create(user: RequestUser, dto: CreateReportDocumentDto) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireDoctor(user);
    await this.ctx.assertPatientAccess(user, dto.patientId);
    const footer = `CR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const row = await this.prisma.medicalReport.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        doctorSpaceId,
        consultationId: dto.consultationId ?? null,
        title: dto.title.trim(),
        content: dto.content.trim(),
        reportType: dto.reportType ?? 'CONSULTATION',
        specialtyCode: dto.specialtyCode?.trim() ?? null,
        documentFooterNumber: footer,
      },
    });
    await this.pdf.enqueueOrGenerate('report', row.id, (j) => this.pdfQueue.add(j));
    return this.serialize(row);
  }

  async patch(user: RequestUser, id: string, dto: PatchReportDocumentDto) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.medicalReport.findFirst({ where: { id, doctorSpaceId } });
    if (!row) throw new NotFoundException('Compte rendu introuvable');
    const updated = await this.prisma.medicalReport.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content?.trim(),
        reportType: dto.reportType,
        pdfStatus: PdfGenerationStatus.pending,
      },
    });
    await this.pdf.enqueueOrGenerate('report', id, (j) => this.pdfQueue.add(j));
    return this.serialize(updated);
  }

  async getById(user: RequestUser, id: string) {
    const row = await this.findReadable(user, id);
    return this.serialize(row);
  }

  async share(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.medicalReport.findFirst({ where: { id, doctorSpaceId } });
    if (!row) throw new NotFoundException('Compte rendu introuvable');
    const shareToken = randomUUID();
    const updated = await this.prisma.medicalReport.update({
      where: { id },
      data: { shareToken, sharedAt: new Date() },
    });
    const base = process.env.PUBLIC_APP_URL ?? 'https://ophthocare.com';
    return {
      shareToken,
      shareUrl: `${base}/share/report/${shareToken}`,
      expiresInHours: 24,
      report: this.serialize(updated),
    };
  }

  async sendToPatient(user: RequestUser, id: string) {
    await this.ctx.requireCabinetStaff(user);
    const row = await this.findReadable(user, id);
    if (row.pdfStatus !== PdfGenerationStatus.ready) {
      await this.pdf.generateAndStore('report', id);
    }
    const fresh = await this.prisma.medicalReport.findUnique({ where: { id } });
    await this.prisma.medicalReport.update({
      where: { id },
      data: { sentToPatientAt: new Date() },
    });
    await this.patients.pushInAppNotification(row.patientId, {
      kind: PatientInAppNotificationKind.document,
      title: 'Compte rendu disponible',
      body: row.title,
      linkPath: '/dashboard/patient/documents',
      meta: { reportId: id, pdfUrl: fresh?.pdfUrl },
    });
    return { sent: true, pdfUrl: fresh?.pdfUrl ?? null };
  }

  private async findReadable(user: RequestUser, id: string) {
    const row = await this.prisma.medicalReport.findFirst({
      where: { id, ...(await this.spaceFilter(user)) },
    });
    if (!row) throw new NotFoundException('Compte rendu introuvable');
    if (user.role === UserRole.patient) {
      const pid = await this.patients.findPatientIdForUser(user.id);
      if (pid !== row.patientId) throw new ForbiddenException();
    }
    return row;
  }

  private async spaceFilter(user: RequestUser) {
    if (user.role === UserRole.patient) return {};
    if (!user.doctorSpaceId) throw new ForbiddenException();
    return { doctorSpaceId: user.doctorSpaceId };
  }
}
