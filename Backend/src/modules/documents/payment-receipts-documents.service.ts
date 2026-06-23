import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PatientInAppNotificationKind, PaymentReceiptStatus, PdfGenerationStatus, Prisma, UserRole } from '@prisma/client';
import ExcelJS from 'exceljs';
import { PrismaService } from '@/prisma/prisma.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsContextService } from '@/modules/doctor-tools/doctor-tools-context.service';
import { PatientsService } from '@/modules/patients/patients.service';
import { DocumentPdfService } from './document-pdf.service';
import { DocumentsPdfQueue } from './documents-pdf.queue';
import { ReceiptNumberService } from './receipt-number.service';
import type { CreatePaymentReceiptDto } from './dto/create-payment-receipt.dto';
import type { PatchPaymentReceiptDto } from './dto/patch-payment-receipt.dto';

@Injectable()
export class PaymentReceiptsDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: DoctorToolsContextService,
    private readonly patients: PatientsService,
    private readonly numbers: ReceiptNumberService,
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
    sequentialNumber: string;
    actType: string;
    actLabel: string;
    amount: Prisma.Decimal;
    currency: string;
    status: PaymentReceiptStatus;
    paidAt: Date | null;
    paymentMethod: string | null;
    pdfUrl: string | null;
    pdfStatus: PdfGenerationStatus;
    verificationUuid: string;
  }) {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      patientId: row.patientId,
      doctorId: row.doctorId,
      doctorSpaceId: row.doctorSpaceId,
      consultationId: row.consultationId,
      sequentialNumber: row.sequentialNumber,
      actType: row.actType,
      actLabel: row.actLabel,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      paidAt: row.paidAt?.toISOString() ?? null,
      paymentMethod: row.paymentMethod,
      pdfUrl: row.pdfUrl,
      pdfStatus: row.pdfStatus,
      verificationUuid: row.verificationUuid,
    };
  }

  async create(user: RequestUser, dto: CreatePaymentReceiptDto) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    await this.ctx.assertPatientAccess(user, dto.patientId);
    const sequentialNumber = await this.numbers.nextSequentialNumber(doctorSpaceId);
    const status = dto.status ?? PaymentReceiptStatus.PENDING;
    const row = await this.prisma.paymentReceipt.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        doctorSpaceId,
        consultationId: dto.consultationId ?? null,
        sequentialNumber,
        actType: dto.actType,
        actLabel: dto.actLabel,
        amount: dto.amount,
        currency: dto.currency ?? 'MAD',
        status,
        paymentMethod: dto.paymentMethod ?? null,
        paidAt: status === PaymentReceiptStatus.PAID ? new Date() : null,
      },
    });
    await this.pdf.enqueueOrGenerate('receipt', row.id, (j) => this.pdfQueue.add(j));
    return this.serialize(row);
  }

  async patch(user: RequestUser, id: string, dto: PatchPaymentReceiptDto) {
    const { doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    const row = await this.prisma.paymentReceipt.findFirst({ where: { id, doctorSpaceId } });
    if (!row) throw new NotFoundException('Reçu introuvable');
    const status = dto.status ?? row.status;
    const updated = await this.prisma.paymentReceipt.update({
      where: { id },
      data: {
        status,
        paymentMethod: dto.paymentMethod ?? row.paymentMethod,
        paidAt:
          status === PaymentReceiptStatus.PAID && !row.paidAt
            ? new Date()
            : status === PaymentReceiptStatus.PENDING
              ? null
              : row.paidAt,
      },
    });
    return this.serialize(updated);
  }

  async listForPatient(user: RequestUser, patientId: string) {
    await this.assertPatientRead(user, patientId);
    const rows = await this.prisma.paymentReceipt.findMany({
      where: { patientId, ...(await this.spaceFilter(user)) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.serialize(r));
  }

  async exportExcel(user: RequestUser, month: string) {
    const { doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    const m = /^(\d{4})-(\d{2})$/.exec(month);
    if (!m) throw new ForbiddenException('month=YYYY-MM requis');
    const from = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    const to = new Date(Number(m[1]), Number(m[2]), 1);
    const rows = await this.prisma.paymentReceipt.findMany({
      where: { doctorSpaceId, createdAt: { gte: from, lt: to } },
      orderBy: { createdAt: 'asc' },
      include: { patient: { include: { user: true } } },
    });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Reçus');
    ws.addRow(['N°', 'Date', 'Patient', 'Acte', 'Montant', 'Devise', 'Statut', 'Mode']);
    for (const r of rows) {
      const name = [r.patient.user?.firstName, r.patient.user?.lastName].filter(Boolean).join(' ');
      ws.addRow([
        r.sequentialNumber,
        r.createdAt.toISOString(),
        name,
        r.actLabel,
        Number(r.amount),
        r.currency,
        r.status,
        r.paymentMethod ?? '',
      ]);
    }
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    return { filename: `receipts-${month}.xlsx`, buffer: buf };
  }

  async dayTotals(user: RequestUser) {
    const { doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const rows = await this.prisma.paymentReceipt.findMany({
      where: { doctorSpaceId, createdAt: { gte: start, lt: end } },
    });
    let billed = 0;
    let paid = 0;
    let pending = 0;
    for (const r of rows) {
      const a = Number(r.amount);
      billed += a;
      if (r.status === PaymentReceiptStatus.PAID) paid += a;
      else if (r.status === PaymentReceiptStatus.PENDING) pending += a;
      else if (r.status === PaymentReceiptStatus.PARTIAL) pending += a * 0.5;
    }
    return { billed, paid, pending, currency: 'MAD', count: rows.length };
  }

  private async assertPatientRead(user: RequestUser, patientId: string) {
    if (user.role === UserRole.patient) {
      const pid = await this.patients.findPatientIdForUser(user.id);
      if (pid !== patientId) throw new ForbiddenException();
      return;
    }
    await this.ctx.assertPatientAccess(user, patientId);
  }

  private async spaceFilter(user: RequestUser) {
    if (user.role === UserRole.patient) return {};
    if (!user.doctorSpaceId) throw new ForbiddenException();
    return { doctorSpaceId: user.doctorSpaceId };
  }
}
