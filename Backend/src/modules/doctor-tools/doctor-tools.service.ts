import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PatientInAppNotificationKind,
  ReferralLetterStatus,
  UserRole,
} from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { PatientsService } from '@/modules/patients/patients.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsContextService } from './doctor-tools-context.service';
import { WebhooksDispatchService } from './webhooks-dispatch.service';
import { CreateMedicalReportDto } from './dto/create-medical-report.dto';
import { UpdateMedicalReportDto } from './dto/update-medical-report.dto';
import { CreateReferralLetterDto } from './dto/create-referral-letter.dto';
import { UpdateReferralLetterDto } from './dto/update-referral-letter.dto';
import { SendPatientMessageDto } from './dto/send-patient-message.dto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AiChatDto } from './dto/ai-chat.dto';

@Injectable()
export class DoctorToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: DoctorToolsContextService,
    private readonly patientsService: PatientsService,
    private readonly webhooksDispatch: WebhooksDispatchService,
  ) {}

  // ——— Messages ———

  async listMessages(user: RequestUser, patientId?: string) {
    const { doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    if (patientId) await this.ctx.assertPatientAccess(user, patientId);
    const rows = await this.prisma.doctorPatientMessage.findMany({
      where: {
        doctorSpaceId,
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        patientId: r.patientId,
        patientName: [r.patient.user?.firstName, r.patient.user?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim(),
        subject: r.subject,
        body: r.body,
        readAt: r.readAt?.toISOString() ?? null,
      })),
    };
  }

  async sendMessage(user: RequestUser, dto: SendPatientMessageDto) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireCabinetStaff(user);
    await this.ctx.assertPatientAccess(user, dto.patientId);

    const row = await this.prisma.doctorPatientMessage.create({
      data: {
        doctorSpaceId,
        doctorId,
        patientId: dto.patientId,
        subject: dto.subject.trim(),
        body: dto.body.trim(),
      },
    });

    await this.patientsService.pushInAppNotification(dto.patientId, {
      kind: PatientInAppNotificationKind.cabinet_message,
      title: dto.subject.trim(),
      body: dto.body.trim(),
      linkPath: '/dashboard/patient',
      meta: { messageId: row.id, doctorSpaceId },
    });

    void this.webhooksDispatch.dispatch(doctorSpaceId, 'message.sent', {
      messageId: row.id,
      patientId: dto.patientId,
      subject: dto.subject,
    });

    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      patientId: row.patientId,
      subject: row.subject,
      body: row.body,
    };
  }

  // ——— Comptes rendus ———

  async listReports(user: RequestUser, patientId?: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    if (patientId) await this.ctx.assertPatientAccess(user, patientId);
    const rows = await this.prisma.medicalReport.findMany({
      where: { doctorSpaceId, ...(patientId ? { patientId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        patientId: r.patientId,
        consultationId: r.consultationId,
        title: r.title,
        content: r.content,
        specialtyCode: r.specialtyCode,
      })),
    };
  }

  async createReport(user: RequestUser, dto: CreateMedicalReportDto) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireDoctor(user);
    await this.ctx.assertPatientAccess(user, dto.patientId);
    const row = await this.prisma.medicalReport.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        doctorSpaceId,
        consultationId: dto.consultationId ?? null,
        title: dto.title.trim(),
        content: dto.content.trim(),
        specialtyCode: dto.specialtyCode?.trim() ?? null,
      },
    });
    await this.patientsService.pushInAppNotification(dto.patientId, {
      kind: PatientInAppNotificationKind.document,
      title: 'Compte rendu disponible',
      body: dto.title.trim(),
      linkPath: '/dashboard/patient/documents',
      meta: { reportId: row.id, type: 'medical_report' },
    });
    void this.webhooksDispatch.dispatch(doctorSpaceId, 'report.created', {
      reportId: row.id,
      patientId: dto.patientId,
    });
    return this.serializeReport(row);
  }

  async updateReport(user: RequestUser, id: string, dto: UpdateMedicalReportDto) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.medicalReport.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Compte rendu introuvable');
    const updated = await this.prisma.medicalReport.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content?.trim(),
        specialtyCode: dto.specialtyCode?.trim(),
      },
    });
    return this.serializeReport(updated);
  }

  async getReport(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.medicalReport.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Compte rendu introuvable');
    return this.serializeReport(row);
  }

  private serializeReport(row: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    consultationId: string | null;
    title: string;
    content: string;
    specialtyCode: string | null;
  }) {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      patientId: row.patientId,
      consultationId: row.consultationId,
      title: row.title,
      content: row.content,
      specialtyCode: row.specialtyCode,
    };
  }

  // ——— Lettres de référence ———

  async listReferrals(user: RequestUser, patientId?: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    if (patientId) await this.ctx.assertPatientAccess(user, patientId);
    const rows = await this.prisma.referralLetter.findMany({
      where: { doctorSpaceId, ...(patientId ? { patientId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { items: rows.map((r) => this.serializeReferral(r)) };
  }

  async createReferral(user: RequestUser, dto: CreateReferralLetterDto) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireDoctor(user);
    await this.ctx.assertPatientAccess(user, dto.patientId);
    const row = await this.prisma.referralLetter.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        doctorSpaceId,
        consultationId: dto.consultationId ?? null,
        recipientName: dto.recipientName.trim(),
        recipientSpecialty: dto.recipientSpecialty?.trim() ?? null,
        recipientAddress: dto.recipientAddress?.trim() ?? null,
        body: dto.body.trim(),
        status: ReferralLetterStatus.draft,
      },
    });
    return this.serializeReferral(row);
  }

  async updateReferral(user: RequestUser, id: string, dto: UpdateReferralLetterDto) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.referralLetter.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Lettre introuvable');
    if (row.status === ReferralLetterStatus.sent) {
      throw new BadRequestException('Lettre déjà envoyée');
    }
    const updated = await this.prisma.referralLetter.update({
      where: { id },
      data: {
        recipientName: dto.recipientName?.trim(),
        recipientSpecialty: dto.recipientSpecialty?.trim(),
        recipientAddress: dto.recipientAddress?.trim(),
        body: dto.body?.trim(),
      },
    });
    return this.serializeReferral(updated);
  }

  async sendReferral(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.referralLetter.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Lettre introuvable');
    const updated = await this.prisma.referralLetter.update({
      where: { id },
      data: { status: ReferralLetterStatus.sent },
    });
    await this.patientsService.pushInAppNotification(row.patientId, {
      kind: PatientInAppNotificationKind.document,
      title: 'Lettre de référence',
      body: `Orientation vers ${row.recipientName}`,
      linkPath: '/dashboard/patient/documents',
      meta: { referralLetterId: id },
    });
    void this.webhooksDispatch.dispatch(doctorSpaceId, 'referral.sent', {
      referralLetterId: id,
      patientId: row.patientId,
    });
    return this.serializeReferral(updated);
  }

  private serializeReferral(row: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    patientId: string;
    consultationId: string | null;
    recipientName: string;
    recipientSpecialty: string | null;
    recipientAddress: string | null;
    body: string;
    status: ReferralLetterStatus;
  }) {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      patientId: row.patientId,
      consultationId: row.consultationId,
      recipientName: row.recipientName,
      recipientSpecialty: row.recipientSpecialty,
      recipientAddress: row.recipientAddress,
      body: row.body,
      status: row.status,
    };
  }

  // ——— Webhooks ———

  async listWebhooks(user: RequestUser) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const rows = await this.prisma.webhook.findMany({
      where: { doctorSpaceId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: rows.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        isActive: w.isActive,
        lastDeliveryAt: w.lastDeliveryAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
      })),
    };
  }

  async createWebhook(user: RequestUser, dto: CreateWebhookDto) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const secret = dto.secret?.trim() || randomUUID();
    const row = await this.prisma.webhook.create({
      data: {
        doctorSpaceId,
        url: dto.url.trim(),
        events: dto.events,
        secret,
        isActive: dto.isActive ?? true,
      },
    });
    return {
      id: row.id,
      url: row.url,
      events: row.events,
      isActive: row.isActive,
      secret,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateWebhook(user: RequestUser, id: string, dto: UpdateWebhookDto) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const existing = await this.prisma.webhook.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!existing) throw new NotFoundException('Webhook introuvable');
    const row = await this.prisma.webhook.update({
      where: { id },
      data: {
        url: dto.url?.trim(),
        events: dto.events,
        isActive: dto.isActive,
        secret: dto.secret?.trim(),
      },
    });
    return {
      id: row.id,
      url: row.url,
      events: row.events,
      isActive: row.isActive,
    };
  }

  async deleteWebhook(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const existing = await this.prisma.webhook.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!existing) throw new NotFoundException('Webhook introuvable');
    await this.prisma.webhook.delete({ where: { id } });
    return { id, deleted: true };
  }

  async testWebhook(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const hook = await this.prisma.webhook.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!hook) throw new NotFoundException('Webhook introuvable');
    await this.webhooksDispatch.deliverToWebhook(id, 'webhook.test', {
      webhookId: id,
      message: 'Test OphthoCare',
    });
    return { ok: true };
  }

  async webhookLogs(user: RequestUser, webhookId: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const hook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, doctorSpaceId },
    });
    if (!hook) throw new NotFoundException('Webhook introuvable');
    const logs = await this.prisma.webhookDeliveryLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      items: logs.map((l) => ({
        id: l.id,
        createdAt: l.createdAt.toISOString(),
        event: l.event,
        status: l.status,
        responseCode: l.responseCode,
        error: l.error,
      })),
    };
  }

  // ——— API keys ———

  async listApiKeys(user: RequestUser) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const rows = await this.prisma.apiKey.findMany({
      where: { doctorSpaceId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: rows.map((k) => ({
        id: k.id,
        label: k.label,
        keyPrefix: k.keyPrefix,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      })),
    };
  }

  async createApiKey(user: RequestUser, dto: CreateApiKeyDto) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const raw = `oc_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(raw).digest('hex');
    const keyPrefix = raw.slice(0, 12);
    const row = await this.prisma.apiKey.create({
      data: {
        doctorSpaceId,
        label: dto.label.trim(),
        keyHash,
        keyPrefix,
      },
    });
    return {
      id: row.id,
      label: row.label,
      keyPrefix: row.keyPrefix,
      apiKey: raw,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async revokeApiKey(user: RequestUser, id: string) {
    const { doctorSpaceId } = await this.ctx.requireDoctor(user);
    const row = await this.prisma.apiKey.findFirst({
      where: { id, doctorSpaceId },
    });
    if (!row) throw new NotFoundException('Clé introuvable');
    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
    return { id, revoked: true };
  }

  // ——— IA ———

  async aiChat(user: RequestUser, dto: AiChatDto) {
    await this.ctx.requireDoctor(user);
    let patientContext = '';
    if (dto.patientId) {
      await this.ctx.assertPatientAccess(user, dto.patientId);
      const p = await this.prisma.patient.findFirst({
        where: { id: dto.patientId },
        include: {
          user: { select: { firstName: true, lastName: true } },
          consultations: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
              diagnosis: true,
              observations: true,
              plan: true,
              specialtyCode: true,
              createdAt: true,
            },
          },
        },
      });
      if (p) {
        const name = [p.user?.firstName, p.user?.lastName].filter(Boolean).join(' ');
        patientContext = `Patient: ${name}. Dernières consultations: ${JSON.stringify(p.consultations)}`;
      }
    }

    const systemPrompt =
      'Tu es un assistant médical pour médecins ophtalmologistes et généralistes. ' +
      'Réponds en français, de façon structurée. Ne remplace pas le jugement clinique. ' +
      (patientContext ? `\nContexte dossier: ${patientContext}` : '') +
      (dto.context ? `\n${dto.context}` : '');

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const lastUser = [...dto.messages].reverse().find((m) => m.role === 'user');
    if (!apiKey) {
      return {
        provider: 'local',
        reply: this.localAiReply(lastUser?.content ?? '', patientContext),
        disclaimer:
          'OPENAI_API_KEY non configuré — réponse indicative locale. Ajoutez la clé dans Backend/.env pour l’assistant complet.',
      };
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...dto.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.4,
          max_tokens: 1200,
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = json.choices?.[0]?.message?.content?.trim() ?? 'Réponse vide.';
      return { provider: 'openai', reply, disclaimer: null };
    } catch (e) {
      return {
        provider: 'local',
        reply: this.localAiReply(lastUser?.content ?? '', patientContext),
        disclaimer: `OpenAI indisponible (${(e as Error).message}). Réponse locale.`,
      };
    }
  }

  private localAiReply(question: string, patientContext: string): string {
    const q = question.toLowerCase();
    if (q.includes('compte rendu') || q.includes('compte-rendu')) {
      return (
        'Pour un compte rendu : structurez en motif, antécédents, examen, conclusion et conduite. ' +
        'Utilisez l’onglet « Comptes rendus » du dossier patient pour enregistrer et notifier le patient.'
      );
    }
    if (q.includes('glaucome') || q.includes('excavation')) {
      return (
        'Évaluation glaucome : PIO, pachymétrie, champ visuel, OCT RNFL/GCL, fond d’œil. ' +
        'Corrélation clinique indispensable.'
      );
    }
    return (
      `Question reçue : « ${question.slice(0, 200)} ». ` +
      (patientContext ? `Contexte chargé. ` : '') +
      'Configurez OPENAI_API_KEY pour une analyse approfondie. En attendant, documentez dans une consultation et un compte rendu structuré.'
    );
  }
}
