import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { SpecialtiesService } from '@/modules/specialties/specialties.service';

export function generatePreConsultPublicToken(): string {
  return randomBytes(24).toString('base64url');
}

@Injectable()
export class PublicPreConsultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly specialtiesService: SpecialtiesService,
  ) {}

  async ensurePublicToken(formId: string): Promise<string> {
    const row = await this.prisma.preConsultationForm.findUnique({
      where: { id: formId },
      select: { id: true, publicToken: true },
    });
    if (!row) throw new NotFoundException('Formulaire introuvable');
    if (row.publicToken) return row.publicToken;
    const token = generatePreConsultPublicToken();
    await this.prisma.preConsultationForm.update({
      where: { id: formId },
      data: { publicToken: token },
    });
    return token;
  }

  async getByToken(token: string) {
    const form = await this.prisma.preConsultationForm.findFirst({
      where: { publicToken: token },
      include: {
        appointmentLink: {
          include: {
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                specialty: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
    });
    if (!form) throw new NotFoundException('Lien invalide ou expiré');

    const apt = form.appointmentLink;
    if (!apt || apt.deletedAt) {
      throw new NotFoundException('Rendez-vous introuvable');
    }
    if (apt.status === AppointmentStatus.cancelled || apt.status === AppointmentStatus.completed) {
      throw new GoneException('Ce rendez-vous ne accepte plus de questionnaire');
    }

    const specialtyCode =
      form.specialtyCode ?? apt.doctor.specialtyCode ?? 'general-medicine';
    const template = await this.specialtiesService.getTemplateByCode(specialtyCode);
    const u = apt.doctor.user;
    const doctorName =
      [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || 'Votre médecin';

    const submitted = Boolean(form.originalSnapshot);
    const editable =
      !submitted &&
      (apt.status === AppointmentStatus.pending ||
        apt.status === AppointmentStatus.confirmed ||
        apt.status === AppointmentStatus.in_progress);

    return {
      token,
      appointmentId: apt.id,
      appointmentStart: apt.startTime.toISOString(),
      doctorName,
      specialtyName: apt.doctor.specialty?.name ?? specialtyCode,
      specialtyCode,
      template,
      form: {
        id: form.id,
        responses: (form.responses ?? {}) as Record<string, unknown>,
        submitted,
        updatedAt: form.updatedAt.toISOString(),
      },
      editable,
    };
  }

  async submitByToken(token: string, responses: Record<string, unknown>) {
    const form = await this.prisma.preConsultationForm.findFirst({
      where: { publicToken: token },
      include: { appointmentLink: true },
    });
    if (!form) throw new NotFoundException('Lien invalide');
    const apt = form.appointmentLink;
    if (!apt || apt.deletedAt) throw new NotFoundException('Rendez-vous introuvable');
    if (form.originalSnapshot) {
      throw new BadRequestException('Questionnaire déjà soumis');
    }
    if (
      apt.status !== AppointmentStatus.pending &&
      apt.status !== AppointmentStatus.confirmed &&
      apt.status !== AppointmentStatus.in_progress
    ) {
      throw new BadRequestException('Ce rendez-vous ne permet plus la saisie');
    }

    const snapshot = { ...responses };
    await this.prisma.preConsultationForm.update({
      where: { id: form.id },
      data: {
        responses: responses as Prisma.InputJsonValue,
        originalSnapshot: snapshot as Prisma.InputJsonValue,
      },
    });

    return { ok: true, submitted: true };
  }
}
