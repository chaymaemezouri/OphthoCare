import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BroadcastRecipientFilter,
  PatientInAppNotificationKind,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { DoctorToolsContextService } from '@/modules/doctor-tools/doctor-tools-context.service';
import { PatientsService } from '@/modules/patients/patients.service';
import { MessagingBroadcastQueue } from './messaging-broadcast.queue';
import type { SendBroadcastDto } from './dto/send-broadcast.dto';
import {
  buildConversationId,
  decodeMessageCursor,
  encodeMessageCursor,
} from './messaging.util';

export type SerializedMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  senderName: string;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: DoctorToolsContextService,
    private readonly patients: PatientsService,
    private readonly broadcastQueue: MessagingBroadcastQueue,
  ) {}

  async listConversations(user: RequestUser) {
    const where = await this.conversationWhereForUser(user);
    const rows = await this.prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 80,
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctorSpace: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    const unread = await this.getUnreadTotal(user);
    return {
      unreadTotal: unread,
      items: rows.map((c) => {
        const last = c.messages[0];
        const patientName = [c.patient.user?.firstName, c.patient.user?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        return {
          id: c.id,
          patientId: c.patientId,
          doctorSpaceId: c.doctorSpaceId,
          doctorSpaceName: c.doctorSpace.name,
          patientName: patientName || c.patient.user?.email || 'Patient',
          lastMessageAt: c.lastMessageAt.toISOString(),
          lastMessagePreview: last?.content?.slice(0, 120) ?? null,
          unreadCount:
            user.role === UserRole.patient ? c.unreadCountPatient : c.unreadCountDoctor,
        };
      }),
    };
  }

  async getMessages(user: RequestUser, conversationId: string, cursor?: string, limit = 30) {
    await this.assertCanAccessConversation(user, conversationId);
    const take = Math.min(Math.max(limit, 1), 50);
    const decoded = cursor ? decodeMessageCursor(cursor) : null;
    const rows = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(decoded
          ? {
              OR: [
                { createdAt: { lt: decoded.createdAt } },
                { createdAt: decoded.createdAt, id: { lt: decoded.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const nextCursor =
      hasMore && page.length > 0
        ? encodeMessageCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
        : null;
    return {
      items: page.reverse().map((m) => this.serializeMessage(m)),
      nextCursor,
    };
  }

  async createConversation(user: RequestUser, doctorSpaceId: string) {
    if (user.role !== UserRole.patient) {
      throw new ForbiddenException('Seul le patient peut initier une conversation');
    }
    const patientId = await this.patients.findPatientIdForUser(user.id);
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { userId: true },
    });
    if (!patient?.userId) throw new BadRequestException('Profil patient incomplet');

    const hasAccess = await this.prisma.patientDoctorAccess.findFirst({
      where: { patientId, doctorSpaceId },
    });
    if (!hasAccess) {
      const apt = await this.prisma.appointment.findFirst({
        where: { patientId, doctorSpaceId, deletedAt: null },
      });
      if (!apt) {
        throw new ForbiddenException(
          'Vous ne pouvez contacter que les cabinets où vous avez eu un rendez-vous',
        );
      }
    }

    const id = buildConversationId(patient.userId, doctorSpaceId);
    const row = await this.prisma.conversation.upsert({
      where: { patientId_doctorSpaceId: { patientId, doctorSpaceId } },
      create: { id, patientId, doctorSpaceId },
      update: {},
    });
    return { id: row.id, patientId: row.patientId, doctorSpaceId: row.doctorSpaceId };
  }

  async sendMessage(user: RequestUser, conversationId: string, content: string) {
    const text = content.trim();
    if (!text) throw new BadRequestException('Message vide');
    await this.assertCanAccessConversation(user, conversationId);
    if (user.role === UserRole.trainee) {
      throw new ForbiddenException('Accès messagerie refusé');
    }
    return this.persistMessage(user, conversationId, text);
  }

  async markMessageRead(user: RequestUser, messageId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });
    if (!msg) throw new NotFoundException('Message introuvable');
    await this.assertCanAccessConversation(user, msg.conversationId);
    if (msg.senderId === user.id) return { ok: true };
    if (msg.readAt) return { ok: true };

    await this.prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: { id: messageId },
        data: { readAt: new Date() },
      });
      const dec =
        user.role === UserRole.patient
          ? { unreadCountPatient: { decrement: 1 } }
          : { unreadCountDoctor: { decrement: 1 } };
      await tx.conversation.update({
        where: { id: msg.conversationId },
        data: dec,
      });
    });
    return { ok: true, conversationId: msg.conversationId, messageId };
  }

  async getUnreadTotal(user: RequestUser): Promise<number> {
    const where = await this.conversationWhereForUser(user);
    if (user.role === UserRole.patient) {
      const agg = await this.prisma.conversation.aggregate({
        where,
        _sum: { unreadCountPatient: true },
      });
      return agg._sum.unreadCountPatient ?? 0;
    }
    const agg = await this.prisma.conversation.aggregate({
      where,
      _sum: { unreadCountDoctor: true },
    });
    return agg._sum.unreadCountDoctor ?? 0;
  }

  async broadcast(user: RequestUser, dto: SendBroadcastDto) {
    const { doctorId, doctorSpaceId } = await this.ctx.requireDoctor(user);
    const recipients = await this.resolveBroadcastRecipients(doctorSpaceId, dto.recipientFilter);
    const row = await this.prisma.broadcastLog.create({
      data: {
        doctorSpaceId,
        doctorId,
        subject: dto.subject.trim(),
        content: dto.content.trim(),
        recipientFilter: dto.recipientFilter,
        recipientCount: recipients.length,
      },
    });
    try {
      await this.broadcastQueue.add({
        subject: dto.subject.trim(),
        content: dto.content.trim(),
        recipients,
      });
    } catch {
      for (const r of recipients) {
        await this.patients.pushInAppNotification(r.patientId, {
          kind: PatientInAppNotificationKind.cabinet_message,
          title: dto.subject.trim(),
          body: dto.content.trim().slice(0, 200),
          linkPath: '/dashboard/patient/messages',
          meta: { broadcastId: row.id },
        });
      }
    }
    return {
      id: row.id,
      recipientCount: recipients.length,
      sentAt: row.sentAt.toISOString(),
    };
  }

  async listEligibleSpacesForPatient(user: RequestUser) {
    if (user.role !== UserRole.patient) throw new ForbiddenException();
    const patientId = await this.patients.findPatientIdForUser(user.id);
    const accesses = await this.prisma.patientDoctorAccess.findMany({
      where: { patientId },
      include: { doctorSpace: { select: { id: true, name: true } } },
    });
    if (accesses.length > 0) {
      return {
        items: accesses.map((a) => ({
          doctorSpaceId: a.doctorSpaceId,
          name: a.doctorSpace.name,
        })),
      };
    }
    const apts = await this.prisma.appointment.findMany({
      where: { patientId, deletedAt: null, doctorSpaceId: { not: null } },
      select: { doctorSpaceId: true, doctorSpace: { select: { id: true, name: true } } },
      distinct: ['doctorSpaceId'],
    });
    return {
      items: apts
        .filter((a) => a.doctorSpace)
        .map((a) => ({
          doctorSpaceId: a.doctorSpaceId!,
          name: a.doctorSpace!.name,
        })),
    };
  }

  async conversationIdsForUser(user: RequestUser): Promise<string[]> {
    const where = await this.conversationWhereForUser(user);
    const rows = await this.prisma.conversation.findMany({
      where,
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  private async persistMessage(
    user: RequestUser,
    conversationId: string,
    content: string,
  ): Promise<SerializedMessage> {
    const isPatient = user.role === UserRole.patient;
    const created = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: user.id,
          senderRole: user.role,
          content,
        },
        include: {
          sender: { select: { firstName: true, lastName: true, email: true } },
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          ...(isPatient
            ? { unreadCountDoctor: { increment: 1 } }
            : { unreadCountPatient: { increment: 1 } }),
        },
      });
      return msg;
    });
    return this.serializeMessage(created);
  }

  private serializeMessage(m: {
    id: string;
    conversationId: string;
    senderId: string;
    senderRole: UserRole;
    content: string;
    readAt: Date | null;
    createdAt: Date;
    sender: { firstName: string | null; lastName: string | null; email: string };
  }): SerializedMessage {
    const senderName =
      [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ').trim() ||
      m.sender.email;
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderRole: m.senderRole,
      content: m.content,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      senderName,
    };
  }

  private async conversationWhereForUser(
    user: RequestUser,
  ): Promise<Prisma.ConversationWhereInput> {
    if (user.role === UserRole.patient) {
      const patientId = await this.patients.findPatientIdForUser(user.id);
      return { patientId };
    }
    if (user.role === UserRole.doctor || user.role === UserRole.secretary) {
      if (!user.doctorSpaceId) throw new ForbiddenException('Espace cabinet requis');
      return { doctorSpaceId: user.doctorSpaceId };
    }
    throw new ForbiddenException('Accès messagerie refusé');
  }

  private async assertCanAccessConversation(user: RequestUser, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (user.role === UserRole.patient) {
      const patientId = await this.patients.findPatientIdForUser(user.id);
      if (conv.patientId !== patientId) throw new ForbiddenException();
      return conv;
    }
    if (user.role === UserRole.doctor || user.role === UserRole.secretary) {
      if (!user.doctorSpaceId || conv.doctorSpaceId !== user.doctorSpaceId) {
        throw new ForbiddenException();
      }
      return conv;
    }
    throw new ForbiddenException();
  }

  private async resolveBroadcastRecipients(
    doctorSpaceId: string,
    filter: BroadcastRecipientFilter,
  ): Promise<{ email: string; patientId: string }[]> {
    const accesses = await this.prisma.patientDoctorAccess.findMany({
      where: { doctorSpaceId },
      include: { patient: { include: { user: { select: { email: true } } } } },
    });
    let patientIds = accesses.map((a) => a.patientId);
    if (filter === BroadcastRecipientFilter.ACTIVE_LAST_30D) {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const recent = await this.prisma.appointment.findMany({
        where: {
          doctorSpaceId,
          patientId: { in: patientIds },
          startTime: { gte: since },
          deletedAt: null,
          status: { not: 'cancelled' },
        },
        select: { patientId: true },
        distinct: ['patientId'],
      });
      const set = new Set(recent.map((r) => r.patientId));
      patientIds = patientIds.filter((id) => set.has(id));
    } else if (filter === BroadcastRecipientFilter.CHRONIC) {
      const patients = await this.prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, antecedents: true, medicalData: true, diagnoses: true },
      });
      patientIds = patients
        .filter((p) => {
          if (p.antecedents.length > 0) return true;
          const md = p.medicalData as Record<string, unknown> | null;
          if (md && (md.chronicDiseases || md.chronicPlan || md.chronicFollowUp)) return true;
          return Array.isArray(p.diagnoses) && (p.diagnoses as unknown[]).length > 0;
        })
        .map((p) => p.id);
    }
    const rows = await this.prisma.patient.findMany({
      where: { id: { in: patientIds } },
      include: { user: { select: { email: true } } },
    });
    return rows
      .filter((p) => p.user?.email)
      .map((p) => ({ email: p.user!.email, patientId: p.id }));
  }
}
