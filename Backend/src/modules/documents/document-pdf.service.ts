import { Injectable, Logger } from '@nestjs/common';
import { PdfGenerationStatus, Prisma } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { PrismaService } from '@/prisma/prisma.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTemplateService } from './document-template.service';
import type { DocumentKind, DocumentHeaderContext, DocumentRenderPayload, MedicationLine } from './documents.types';

@Injectable()
export class DocumentPdfService {
  private readonly log = new Logger(DocumentPdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DocumentStorageService,
    private readonly templates: DocumentTemplateService,
  ) {}

  async enqueueOrGenerate(
    kind: DocumentKind,
    id: string,
    queueAdd?: (data: { kind: DocumentKind; id: string }) => Promise<unknown>,
  ) {
    if (queueAdd) {
      try {
        await queueAdd({ kind, id });
        return { queued: true };
      } catch (e) {
        this.log.warn(`Queue unavailable, sync PDF for ${kind}/${id}: ${String(e)}`);
      }
    }
    await this.generateAndStore(kind, id);
    return { queued: false };
  }

  async generateAndStore(kind: DocumentKind, id: string) {
    const ctx = await this.loadContext(kind, id);
    if (!ctx) return;
    try {
      const html = await this.templates.buildHtml(ctx.header, ctx.payload);
      const pdf = await this.htmlToPdf(html, ctx.plainText);
      const key = this.storage.buildKey(ctx.doctorSpaceId, kind, id);
      const storageRef = await this.storage.putPdf(key, pdf);
      const signedUrl = await this.storage.createSignedDownloadUrl(storageRef, { kind, id });
      await this.markReady(kind, id, storageRef, signedUrl);
    } catch (e) {
      this.log.error(`PDF failed ${kind}/${id}`, e);
      await this.markFailed(kind, id);
    }
  }

  private async markReady(kind: DocumentKind, id: string, storageRef: string, pdfUrl: string) {
    const data = { pdfStorageKey: storageRef, pdfUrl, pdfStatus: PdfGenerationStatus.ready };
    if (kind === 'prescription') {
      await this.prisma.prescription.update({ where: { id }, data });
    } else if (kind === 'receipt') {
      await this.prisma.paymentReceipt.update({ where: { id }, data });
    } else {
      await this.prisma.medicalReport.update({ where: { id }, data });
    }
  }

  private async markFailed(kind: DocumentKind, id: string) {
    const data = { pdfStatus: PdfGenerationStatus.failed };
    if (kind === 'prescription') {
      await this.prisma.prescription.update({ where: { id }, data });
    } else if (kind === 'receipt') {
      await this.prisma.paymentReceipt.update({ where: { id }, data });
    } else {
      await this.prisma.medicalReport.update({ where: { id }, data });
    }
  }

  private async htmlToPdf(html: string, plainFallback: string): Promise<Buffer> {
    try {
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const buf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
      await browser.close();
      return Buffer.from(buf);
    } catch (e) {
      this.log.warn(`Puppeteer unavailable, pdfkit fallback: ${String(e)}`);
      return this.pdfkitBuffer(plainFallback);
    }
  }

  private pdfkitBuffer(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 48 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(11).text(text, { align: 'left' });
      doc.end();
    });
  }

  private async loadContext(kind: DocumentKind, id: string) {
    if (kind === 'prescription') {
      const row = await this.prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true, specialty: true, doctorSpace: { include: { sites: { where: { isPrimary: true }, take: 1 } } } } },
        },
      });
      if (!row) return null;
      const meds = parseMedications(row.medications);
      const bodyHtml = meds.length
        ? `<ol>${meds.map((m) => `<li><strong>${esc(m.name)}</strong>${linePart(m.dosage)}${linePart(m.frequency)}${linePart(m.duration)}${m.instructions ? `<br/><em>${esc(m.instructions)}</em>` : ''}</li>`).join('')}</ol>`
        : '<p>—</p>';
      const plain = meds.map((m) => `${m.name} ${m.dosage ?? ''} ${m.frequency ?? ''}`).join('\n');
      return this.buildCtx(row, 'Ordonnance médicale', bodyHtml, plain, row.verificationUuid, 'prescription', row.documentFooterNumber, row.doctor, row.patient);
    }
    if (kind === 'receipt') {
      const row = await this.prisma.paymentReceipt.findUnique({
        where: { id },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true, specialty: true, doctorSpace: { include: { sites: { where: { isPrimary: true }, take: 1 } } } } },
        },
      });
      if (!row) return null;
      const bodyHtml = `<p><strong>${esc(row.actLabel)}</strong> (${esc(row.actType)})</p>
        <p>Montant : <strong>${Number(row.amount)} ${esc(row.currency)}</strong></p>
        <p>Statut : ${esc(row.status)}${row.paymentMethod ? ` — ${esc(row.paymentMethod)}` : ''}</p>
        <p>N° reçu : ${esc(row.sequentialNumber)}</p>`;
      const plain = `Reçu ${row.sequentialNumber} ${row.actLabel} ${row.amount} ${row.currency}`;
      return this.buildCtx(row, 'Reçu de paiement', bodyHtml, plain, row.verificationUuid, 'receipt', row.sequentialNumber, row.doctor, row.patient);
    }
    const row = await this.prisma.medicalReport.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, specialty: true, doctorSpace: { include: { sites: { where: { isPrimary: true }, take: 1 } } } } },
      },
    });
    if (!row) return null;
    const bodyHtml = row.content.replace(/\n/g, '<br/>');
    return this.buildCtx(row, row.title, bodyHtml, row.content, row.verificationUuid, 'report', row.documentFooterNumber, row.doctor, row.patient);
  }

  private buildCtx(
    row: { doctorSpaceId: string; createdAt: Date },
    title: string,
    bodyHtml: string,
    plainText: string,
    verificationUuid: string,
    verifyType: 'prescription' | 'receipt' | 'report',
    footerNumber: string | null | undefined,
    doctor: {
      orderNumber: string | null;
      signatureUrl: string | null;
      specialty: { name: string };
      user: { firstName: string | null; lastName: string | null } | null;
      doctorSpace: { sites: { name: string; street: string; city: string; phone: string | null }[] } | null;
    },
    patient: { dateOfBirth: Date | null; user: { firstName: string | null; lastName: string | null } | null },
  ) {
    const site = doctor.doctorSpace?.sites[0];
    const doctorName = [doctor.user?.firstName, doctor.user?.lastName].filter(Boolean).join(' ') || 'Médecin';
    const patientName = [patient.user?.firstName, patient.user?.lastName].filter(Boolean).join(' ') || 'Patient';
    const header: DocumentHeaderContext = {
      platformName: 'OphthoCare',
      doctorName: `Dr ${doctorName}`,
      specialtyName: doctor.specialty.name,
      orderNumber: doctor.orderNumber,
      siteName: site?.name,
      siteAddress: site ? `${site.street}, ${site.city}` : undefined,
      sitePhone: site?.phone ?? undefined,
    };
    const payload: DocumentRenderPayload = {
      title,
      patientName,
      patientDob: patient.dateOfBirth ? patient.dateOfBirth.toISOString().slice(0, 10) : null,
      bodyHtml,
      footerNumber: footerNumber ?? null,
      verifyUrl: this.templates.buildVerifyUrl(verifyType, verificationUuid),
      generatedAt: row.createdAt.toISOString(),
      signatureDataUrl: this.loadSignatureDataUrl(doctor.signatureUrl),
    };
    return {
      doctorSpaceId: row.doctorSpaceId,
      header,
      payload,
      plainText,
    };
  }

  private loadSignatureDataUrl(signatureUrl: string | null): string | null {
    const key = signatureUrl?.trim();
    if (!key?.startsWith('private:sig:')) return null;
    const rel = key.slice('private:sig:'.length);
    const full = join(process.cwd(), 'private', 'doctor-signatures', rel);
    if (!existsSync(full)) return null;
    const buf = readFileSync(full);
    return `data:image/png;base64,${buf.toString('base64')}`;
  }
}

function parseMedications(raw: Prisma.JsonValue): MedicationLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === 'object' && typeof (x as MedicationLine).name === 'string')
    .map((x) => x as MedicationLine);
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function linePart(v?: string) {
  return v ? ` — ${esc(v)}` : '';
}
