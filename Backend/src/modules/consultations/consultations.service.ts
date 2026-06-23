import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConsultationStatus,
  Prisma,
  UserRole,
  PatientInAppNotificationKind,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PatientsService } from '@/modules/patients/patients.service';
import { WebhooksDispatchService } from '@/modules/doctor-tools/webhooks-dispatch.service';
import type { SanitizedUser } from '@/modules/users/users.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { consultationToClinicalStructured } from '@/common/medical/consultation-clinical-mapper';
import { medicalRecordWriteClient } from '@/prisma/medical-dossier.client';

const VITAL_KEYS = [
  'taSys',
  'taDia',
  'fc',
  'poids',
  'taille',
  'spo2',
  'glycemie',
  'imc',
  'pio',
  'temperature',
] as const;

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
    private readonly webhooksDispatch: WebhooksDispatchService,
  ) {}

  private async doctorIdForUser(userId: string): Promise<string | null> {
    const d = await this.prisma.doctor.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    return d?.id ?? null;
  }

  private assertDoctorInSpace(user: RequestUser, consultation: { doctorSpaceId: string; doctorId: string }) {
    if (user.role === UserRole.admin || user.role === UserRole.super_admin) {
      throw new ForbiddenException('Les administrateurs n’ont pas accès aux consultations.');
    }
    if (user.role !== UserRole.doctor) {
      throw new ForbiddenException('Action réservée au médecin');
    }
    if (!user.doctorSpaceId || consultation.doctorSpaceId !== user.doctorSpaceId) {
      throw new ForbiddenException('Consultation hors de votre espace cabinet');
    }
  }

  private async assertDoctorOwnsConsultation(user: RequestUser, consultation: { doctorSpaceId: string; doctorId: string }) {
    if (user.role === UserRole.admin || user.role === UserRole.super_admin) {
      throw new ForbiddenException('Les administrateurs n’ont pas accès aux consultations.');
    }
    this.assertDoctorInSpace(user, consultation);
    const docId = await this.doctorIdForUser(user.id);
    if (!docId || docId !== consultation.doctorId) {
      throw new ForbiddenException('Seul le médecin auteur peut modifier cette consultation');
    }
  }

  private async assertCanReadConsultation(user: RequestUser, row: { patientId: string; doctorSpaceId: string }) {
    if (user.role === UserRole.admin || user.role === UserRole.super_admin) {
      throw new ForbiddenException('Les administrateurs n’ont pas accès aux consultations.');
    }
    if (user.role === UserRole.patient) {
      const pid = await this.patientsService.findPatientIdForUser(user.id);
      if (row.patientId !== pid) {
        throw new ForbiddenException('Accès refusé à cette consultation');
      }
      return;
    }
    if (
      user.role === UserRole.doctor ||
      user.role === UserRole.secretary ||
      user.role === UserRole.trainee
    ) {
      if (!user.doctorSpaceId || row.doctorSpaceId !== user.doctorSpaceId) {
        throw new ForbiddenException('Consultation hors de votre espace cabinet');
      }
      await this.patientsService.assertCanAccessPatient(user, row.patientId);
      return;
    }
    throw new ForbiddenException('Accès refusé');
  }

  private mergeJson(
    current: unknown,
    patch: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    const base =
      current && typeof current === 'object' && !Array.isArray(current)
        ? { ...(current as Record<string, unknown>) }
        : {};
    const out = { ...base };
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) {
        delete out[k];
        continue;
      }
      out[k] = v as unknown;
    }
    return out as Prisma.InputJsonValue;
  }

  private serializeConsultation(
    row: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      appointmentId: string | null;
      patientId: string;
      doctorId: string;
      doctorSpaceId: string;
      specialtyCode: string;
      structuredData: unknown;
      observations: string | null;
      diagnosis: string | null;
      plan: string | null;
      prescriptionIds: string[];
      status: ConsultationStatus;
      startAt: Date | null;
      closedAt: Date | null;
      durationSeconds: number | null;
      preConsultationFormId: string | null;
      importAudit: unknown;
      receipt: {
        id: string;
        amount: unknown;
        currency: string;
        payload: unknown;
        createdAt: Date;
      } | null;
      appointment: {
        id: string;
        startTime: Date;
        preConsultationFormId: string | null;
      } | null;
    },
    opts?: { suggestedPreForm?: unknown },
  ) {
    return {
      id: row.id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      appointmentId: row.appointmentId,
      patientId: row.patientId,
      doctorId: row.doctorId,
      doctorSpaceId: row.doctorSpaceId,
      specialtyCode: row.specialtyCode,
      structuredData: row.structuredData,
      observations: row.observations,
      diagnosis: row.diagnosis,
      plan: row.plan,
      prescriptionIds: row.prescriptionIds,
      status: row.status,
      startAt: row.startAt,
      closedAt: row.closedAt,
      durationSeconds: row.durationSeconds,
      preConsultationFormId: row.preConsultationFormId,
      importAudit: row.importAudit,
      receipt: row.receipt,
      appointment: row.appointment,
      suggestedPreConsultation: opts?.suggestedPreForm,
    };
  }

  async create(user: RequestUser, dto: CreateConsultationDto) {
    if (user.role !== UserRole.doctor) {
      throw new ForbiddenException('Création réservée au médecin');
    }
    const doctorId = await this.doctorIdForUser(user.id);
    if (!doctorId) {
      throw new ForbiddenException('Profil médecin introuvable');
    }

    let doctorSpaceId = user.doctorSpaceId ?? null;
    const appointmentId: string | undefined = dto.appointmentId;
    let specialtyCode = dto.specialtyCode?.trim();

    if (!doctorSpaceId) {
      throw new ForbiddenException('Espace cabinet non résolu');
    }

    let resolvedDoctorId = doctorId;

    if (dto.appointmentId) {
      const apt = await this.prisma.appointment.findFirst({
        where: { id: dto.appointmentId, deletedAt: null },
        include: {
          doctor: { select: { id: true, specialtyCode: true } },
          doctorSpace: { select: { id: true } },
        },
      });
      if (!apt) throw new NotFoundException('Rendez-vous introuvable');
      if (apt.patientId !== dto.patientId) {
        throw new BadRequestException('Le patient ne correspond pas au rendez-vous');
      }
      if (apt.doctorId !== doctorId) {
        throw new ForbiddenException('Ce rendez-vous n’est pas le vôtre');
      }
      resolvedDoctorId = apt.doctorId;
      const spaceFromApt =
        apt.doctorSpace?.id ??
        (
          await this.prisma.doctorSpace.findUnique({
            where: { doctorId: apt.doctorId },
            select: { id: true },
          })
        )?.id;
      doctorSpaceId = spaceFromApt ?? doctorSpaceId;
      if (doctorSpaceId !== user.doctorSpaceId) {
        throw new ForbiddenException('Rendez-vous hors de votre espace cabinet');
      }
      if (!specialtyCode) {
        specialtyCode = apt.doctor.specialtyCode;
      }
    }

    if (!specialtyCode) {
      const d = await this.prisma.doctor.findFirst({
        where: { id: resolvedDoctorId, deletedAt: null },
        select: { specialtyCode: true },
      });
      specialtyCode = d?.specialtyCode ?? 'general-medicine';
    }

    await this.patientsService.assertCanAccessPatient(user, dto.patientId);

    const row = await this.prisma.consultation.create({
      data: {
        patientId: dto.patientId,
        doctorId: resolvedDoctorId,
        doctorSpaceId,
        appointmentId: appointmentId ?? null,
        specialtyCode,
        status: ConsultationStatus.draft,
        startAt: null,
        structuredData: {},
      },
      include: {
        receipt: true,
        appointment: {
          select: { id: true, startTime: true, preConsultationFormId: true },
        },
      },
    });

    const suggested = await this.resolveSuggestedPreForm(row);
    return this.serializeConsultation(row, { suggestedPreForm: suggested });
  }

  private async resolveSuggestedPreForm(row: {
    appointmentId: string | null;
    appointment: { preConsultationFormId: string | null } | null;
  }) {
    const preId = row.appointment?.preConsultationFormId;
    if (!preId) return null;
    const pre = await this.prisma.preConsultationForm.findFirst({
      where: { id: preId },
      select: {
        id: true,
        responses: true,
        originalSnapshot: true,
        specialtyCode: true,
        createdAt: true,
      },
    });
    return pre;
  }

  async listMineForPatient(
    user: RequestUser,
    q: { status?: string; from?: string; to?: string },
  ) {
    if (user.role !== UserRole.patient) {
      throw new ForbiddenException('Accès réservé aux patients');
    }
    const patientId = await this.patientsService.findPatientIdForUser(user.id);
    const where: Prisma.ConsultationWhereInput = { patientId };
    if (q.status && Object.values(ConsultationStatus).includes(q.status as ConsultationStatus)) {
      where.status = q.status as ConsultationStatus;
    }
    const createdAt: Prisma.DateTimeFilter = {};
    if (q.from?.trim()) {
      const d = new Date(q.from.trim());
      if (!Number.isNaN(d.getTime())) createdAt.gte = d;
    }
    if (q.to?.trim()) {
      const d = new Date(q.to.trim());
      if (!Number.isNaN(d.getTime())) createdAt.lte = d;
    }
    if (Object.keys(createdAt).length) where.createdAt = createdAt;

    const rows = await this.prisma.consultation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        receipt: { select: { id: true, amount: true, currency: true, createdAt: true } },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        appointment: { select: { id: true, startTime: true } },
      },
    });

    return rows.map((r) => {
      const u = r.doctor.user!;
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
      return {
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        status: r.status,
        specialtyCode: r.specialtyCode,
        closedAt: r.closedAt?.toISOString() ?? null,
        startAt: r.startAt?.toISOString() ?? null,
        doctor: { id: r.doctor.id, displayName: name },
        appointment: r.appointment
          ? {
              id: r.appointment.id,
              startTime: r.appointment.startTime.toISOString(),
            }
          : null,
        receipt: r.receipt
          ? {
              id: r.receipt.id,
              amount: Number(r.receipt.amount),
              currency: r.receipt.currency,
              createdAt: r.receipt.createdAt.toISOString(),
            }
          : null,
      };
    });
  }

  /** Liste des consultations d’un patient pour le cabinet (médecin / secrétaire / stagiaire / admin). */
  async listForStaffByPatient(user: RequestUser, patientId: string) {
    await this.patientsService.assertCanAccessPatient(user, patientId);

    const where: Prisma.ConsultationWhereInput = { patientId };
    if (user.role !== UserRole.admin) {
      if (!user.doctorSpaceId) {
        throw new ForbiddenException('Espace cabinet non résolu');
      }
      where.doctorSpaceId = user.doctorSpaceId;
    }

    const rows = await this.prisma.consultation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        appointment: { select: { id: true, startTime: true } },
      },
    });

    return rows.map((r) => {
      const u = r.doctor.user!;
      const doctorName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || 'Médecin';
      return {
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        status: r.status,
        specialtyCode: r.specialtyCode,
        closedAt: r.closedAt?.toISOString() ?? null,
        startAt: r.startAt?.toISOString() ?? null,
        plan: r.plan,
        prescriptionIds: r.prescriptionIds,
        doctorName,
        appointment: r.appointment
          ? { id: r.appointment.id, startTime: r.appointment.startTime.toISOString() }
          : null,
      };
    });
  }

  /** Ordonnances du médecin connecté (consultations avec texte plan ou références). */
  async listMinePrescriptions(
    user: RequestUser,
    opts?: { skip?: number; take?: number; q?: string },
  ) {
    if (user.role !== UserRole.doctor && user.role !== UserRole.admin) {
      throw new ForbiddenException('Réservé au médecin ou administrateur');
    }

    const skip = Math.max(0, opts?.skip ?? 0);
    const take = Math.min(50, Math.max(1, opts?.take ?? 15));
    const q = opts?.q?.trim().toLowerCase();

    const where: Prisma.ConsultationWhereInput = {
      OR: [{ plan: { not: null } }, { prescriptionIds: { isEmpty: false } }],
    };

    if (user.role === UserRole.doctor) {
      const doctorId = await this.doctorIdForUser(user.id);
      if (!doctorId) throw new ForbiddenException('Profil médecin introuvable');
      if (!user.doctorSpaceId) throw new ForbiddenException('Espace cabinet non résolu');
      where.doctorId = doctorId;
      where.doctorSpaceId = user.doctorSpaceId;
    }

    const rows = await this.prisma.consultation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        doctor: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        appointment: { select: { id: true, startTime: true } },
      },
    });

    let items = rows
      .filter((r) => (r.plan?.trim().length ?? 0) > 0 || r.prescriptionIds.length > 0)
      .map((r) => {
        const pu = r.patient.user!;
        const patientDisplayName =
          [pu.firstName, pu.lastName].filter(Boolean).join(' ').trim() || pu.email || 'Patient';
        const du = r.doctor.user!;
        const doctorName =
          [du.firstName, du.lastName].filter(Boolean).join(' ').trim() || du.email || 'Médecin';
        return {
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          status: r.status,
          specialtyCode: r.specialtyCode,
          closedAt: r.closedAt?.toISOString() ?? null,
          plan: r.plan?.trim() || null,
          prescriptionIds: r.prescriptionIds,
          patientId: r.patientId,
          patientDisplayName,
          patientDateOfBirth: r.patient.dateOfBirth?.toISOString().slice(0, 10) ?? null,
          doctorName,
          appointment: r.appointment
            ? { id: r.appointment.id, startTime: r.appointment.startTime.toISOString() }
            : null,
        };
      });

    if (q) {
      items = items.filter(
        (r) =>
          r.patientDisplayName.toLowerCase().includes(q) ||
          (r.plan?.toLowerCase().includes(q) ?? false) ||
          r.prescriptionIds.some((id) => id.toLowerCase().includes(q)),
      );
    }

    const total = items.length;
    const page = items.slice(skip, skip + take);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTotal = items.filter((r) => new Date(r.updatedAt) >= monthStart).length;
    const draftCount = items.filter((r) => r.status !== ConsultationStatus.completed).length;

    return { items: page, total, stats: { monthTotal, draftCount } };
  }

  async sharePrescriptionWithPatient(user: RequestUser, id: string) {
    const row = await this.prisma.consultation.findFirst({
      where: { id },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        doctorSpaceId: true,
        plan: true,
        status: true,
      },
    });
    if (!row) throw new NotFoundException('Consultation introuvable');
    await this.assertDoctorOwnsConsultation(user, row);

    const planText = row.plan?.trim();
    if (!planText) {
      throw new BadRequestException(
        'Aucun texte d’ordonnance sur cette consultation. Rédigez le plan dans le dossier patient puis enregistrez.',
      );
    }

    await this.patientsService.pushInAppNotification(row.patientId, {
      kind: PatientInAppNotificationKind.document,
      title: 'Ordonnance disponible',
      body: 'Votre médecin a partagé une ordonnance. Consultez le plan de traitement dans votre espace patient.',
      linkPath: `/dashboard/patient/consultations?open=${encodeURIComponent(id)}`,
      meta: { consultationId: id, type: 'prescription' },
    });

    return { sent: true, consultationId: id };
  }

  async findOne(user: RequestUser, id: string) {
    const row = await this.prisma.consultation.findFirst({
      where: { id },
      include: {
        receipt: true,
        appointment: {
          select: { id: true, startTime: true, preConsultationFormId: true },
        },
      },
    });
    if (!row) throw new NotFoundException('Consultation introuvable');
    await this.assertCanReadConsultation(user, row);
    const suggested = await this.resolveSuggestedPreForm(row);
    return this.serializeConsultation(row, { suggestedPreForm: suggested });
  }

  async start(user: RequestUser, id: string) {
    const row = await this.prisma.consultation.findFirst({ where: { id } });
    if (!row) throw new NotFoundException('Consultation introuvable');
    await this.assertDoctorOwnsConsultation(user, row);
    if (row.status === ConsultationStatus.completed) {
      throw new BadRequestException('Consultation déjà clôturée');
    }
    if (row.status === ConsultationStatus.in_progress) {
      return this.findOne(user, id);
    }
    if (row.status !== ConsultationStatus.draft) {
      throw new BadRequestException('Seul un brouillon peut être démarré');
    }
    const now = new Date();
    const updated = await this.prisma.consultation.update({
      where: { id },
      data: { status: ConsultationStatus.in_progress, startAt: now },
      include: {
        receipt: true,
        appointment: {
          select: { id: true, startTime: true, preConsultationFormId: true },
        },
      },
    });
    const suggested = await this.resolveSuggestedPreForm(updated);
    return this.serializeConsultation(updated, { suggestedPreForm: suggested });
  }

  async update(user: RequestUser, id: string, dto: UpdateConsultationDto) {
    const row = await this.prisma.consultation.findFirst({ where: { id } });
    if (!row) throw new NotFoundException('Consultation introuvable');
    await this.assertDoctorOwnsConsultation(user, row);
    if (row.status === ConsultationStatus.completed) {
      throw new BadRequestException('Consultation clôturée — modification impossible');
    }

    const structuredData =
      dto.structuredData != null
        ? this.mergeJson(row.structuredData, dto.structuredData)
        : undefined;

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        structuredData,
        observations: dto.observations ?? undefined,
        diagnosis: dto.diagnosis ?? undefined,
        plan: dto.plan ?? undefined,
        prescriptionIds: dto.prescriptionIds ?? undefined,
      },
      include: {
        receipt: true,
        appointment: {
          select: { id: true, startTime: true, preConsultationFormId: true },
        },
      },
    });
    const suggested = await this.resolveSuggestedPreForm(updated);
    return this.serializeConsultation(updated, { suggestedPreForm: suggested });
  }

  async close(user: RequestUser, id: string) {
    const row = await this.prisma.consultation.findFirst({ where: { id } });
    if (!row) throw new NotFoundException('Consultation introuvable');
    await this.assertDoctorOwnsConsultation(user, row);
    if (row.status === ConsultationStatus.completed) {
      throw new BadRequestException('Consultation déjà clôturée');
    }
    if (row.status === ConsultationStatus.draft) {
      throw new BadRequestException('Démarrez la consultation avant de la clôturer');
    }

    const closedAt = new Date();
    const start = row.startAt ?? row.createdAt;
    const durationSeconds = Math.max(
      0,
      Math.floor((closedAt.getTime() - start.getTime()) / 1000),
    );

    const doctor = await this.prisma.doctor.findFirst({
      where: { id: row.doctorId, deletedAt: null },
      select: { consultationPrice: true, preferredCurrency: true },
    });
    const amount = doctor?.consultationPrice ?? 0;
    const currency = doctor?.preferredCurrency ?? 'MAD';

    const result = await this.prisma.$transaction(async (tx) => {
      const c = await tx.consultation.update({
        where: { id },
        data: {
          status: ConsultationStatus.completed,
          closedAt,
          durationSeconds,
        },
        include: {
          receipt: true,
          appointment: {
            select: { id: true, startTime: true, preConsultationFormId: true },
          },
        },
      });
      await tx.consultationReceipt.upsert({
        where: { consultationId: id },
        create: {
          consultationId: id,
          amount,
          currency,
          payload: {
            patientId: row.patientId,
            doctorId: row.doctorId,
            specialtyCode: row.specialtyCode,
            durationSeconds,
            closedAt: closedAt.toISOString(),
            paymentStatus: 'pending',
            paidAmount: 0,
          } as Prisma.InputJsonValue,
        },
        update: {
          amount,
          currency,
          payload: {
            patientId: row.patientId,
            doctorId: row.doctorId,
            specialtyCode: row.specialtyCode,
            durationSeconds,
            closedAt: closedAt.toISOString(),
            paymentStatus: 'pending',
            paidAmount: 0,
          } as Prisma.InputJsonValue,
        },
      });
      return c;
    });

    await this.syncMedicalRecordFromConsultation(result, user.id).catch(() => undefined);

    const suggested = await this.resolveSuggestedPreForm(result);
    void this.patientsService
      .pushInAppNotification(row.patientId, {
        kind: PatientInAppNotificationKind.receipt,
        title: 'Reçu disponible',
        body: 'Un reçu d’honoraires est disponible suite à votre consultation.',
        linkPath: '/dashboard/patient/receipts',
        meta: { consultationId: id },
      })
      .catch(() => undefined);
    void this.webhooksDispatch
      .dispatch(row.doctorSpaceId, 'consultation.completed', {
        consultationId: id,
        patientId: row.patientId,
        doctorId: row.doctorId,
        status: ConsultationStatus.completed,
      })
      .catch(() => undefined);
    return this.serializeConsultation(result, { suggestedPreForm: suggested });
  }

  async importPreConsultation(user: RequestUser, id: string, preFormId: string) {
    const row = await this.prisma.consultation.findFirst({ where: { id } });
    if (!row) throw new NotFoundException('Consultation introuvable');
    await this.assertDoctorOwnsConsultation(user, row);
    if (row.status === ConsultationStatus.completed) {
      throw new BadRequestException('Consultation déjà clôturée');
    }

    const form = await this.prisma.preConsultationForm.findFirst({
      where: { id: preFormId },
    });
    if (!form) throw new NotFoundException('Formulaire pré-consultation introuvable');
    if (form.patientId !== row.patientId || form.doctorSpaceId !== row.doctorSpaceId) {
      throw new ForbiddenException('Formulaire incompatible avec cette consultation');
    }

    const original = (form.originalSnapshot ?? form.responses) as Record<string, unknown>;
    const responses = this.mapPreConsultResponses((form.responses ?? {}) as Record<string, unknown>);
    const merged = this.mergeJson(row.structuredData, responses);

    const updated = await this.prisma.consultation.update({
      where: { id },
      data: {
        structuredData: merged,
        preConsultationFormId: preFormId,
        importAudit: {
          originalResponses: original,
          importedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
      include: {
        receipt: true,
        appointment: {
          select: { id: true, startTime: true, preConsultationFormId: true },
        },
      },
    });
    const suggested = await this.resolveSuggestedPreForm(updated);
    return this.serializeConsultation(updated, { suggestedPreForm: suggested });
  }

  async compare(user: RequestUser, id1: string, id2: string) {
    if (user.role !== UserRole.doctor) {
      throw new ForbiddenException('Comparaison réservée au médecin');
    }
    const [a, b] = await Promise.all([
      this.prisma.consultation.findFirst({ where: { id: id1 } }),
      this.prisma.consultation.findFirst({ where: { id: id2 } }),
    ]);
    if (!a || !b) throw new NotFoundException('Consultation introuvable');
    if (a.patientId !== b.patientId) {
      throw new BadRequestException('Comparer deux consultations du même patient uniquement');
    }
    this.assertDoctorInSpace(user, a);
    this.assertDoctorInSpace(user, b);

    const diff = this.diffConsultations(a, b);
    return {
      consultationA: {
        id: a.id,
        createdAt: a.createdAt,
        closedAt: a.closedAt,
        specialtyCode: a.specialtyCode,
      },
      consultationB: {
        id: b.id,
        createdAt: b.createdAt,
        closedAt: b.closedAt,
        specialtyCode: b.specialtyCode,
      },
      diff,
    };
  }

  private diffConsultations(
    a: { structuredData: unknown; observations: string | null; diagnosis: string | null; plan: string | null },
    b: typeof a,
  ): Record<string, { from: unknown; to: unknown }> {
    const out: Record<string, { from: unknown; to: unknown }> = {};
    const flatA = this.flattenStructured(a.structuredData);
    const flatB = this.flattenStructured(b.structuredData);
    const keys = new Set([...Object.keys(flatA), ...Object.keys(flatB)]);
    for (const k of keys) {
      const va = flatA[k];
      const vb = flatB[k];
      if (JSON.stringify(va) !== JSON.stringify(vb)) {
        out[`structuredData.${k}`] = { from: va ?? null, to: vb ?? null };
      }
    }
    for (const top of ['observations', 'diagnosis', 'plan'] as const) {
      const va = a[top];
      const vb = b[top];
      if (va !== vb) {
        out[top] = { from: va ?? null, to: vb ?? null };
      }
    }
    return out;
  }

  private async syncMedicalRecordFromConsultation(
    consultation: {
      patientId: string;
      doctorSpaceId: string;
      appointmentId: string | null;
      specialtyCode: string;
      structuredData: unknown;
      observations: string | null;
      diagnosis: string | null;
      closedAt: Date | null;
    },
    authorUserId: string,
  ) {
    const flat =
      consultation.structuredData &&
      typeof consultation.structuredData === 'object' &&
      !Array.isArray(consultation.structuredData)
        ? (consultation.structuredData as Record<string, unknown>)
        : {};
    const structured = consultationToClinicalStructured(consultation.specialtyCode, flat);
    const dateLabel = consultation.closedAt
      ? consultation.closedAt.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const title = `Consultation du ${dateLabel}`;
    const narrative =
      [consultation.observations, consultation.diagnosis].filter(Boolean).join('\n\n') || null;

    const existing = consultation.appointmentId
      ? ((await medicalRecordWriteClient(this.prisma).findFirst({
          where: {
            appointmentId: consultation.appointmentId,
            doctorSpaceId: consultation.doctorSpaceId,
            deletedAt: null,
          },
        })) as { id: string } | null)
      : null;

    if (existing) {
      await medicalRecordWriteClient(this.prisma).update({
        where: { id: existing.id },
        data: {
          structuredData: structured as Prisma.InputJsonValue,
          title,
          narrative: narrative ?? undefined,
          specialtyCode: consultation.specialtyCode,
        },
      });
      return;
    }

    await medicalRecordWriteClient(this.prisma).create({
      data: {
        patientId: consultation.patientId,
        authorUserId,
        appointmentId: consultation.appointmentId,
        doctorSpaceId: consultation.doctorSpaceId,
        specialtyCode: consultation.specialtyCode,
        title,
        narrative,
        structuredData: structured as Prisma.InputJsonValue,
      },
    });
  }

  /** Alias courants questionnaire → clés SpecialtyField (merge clé à clé + renommage). */
  private mapPreConsultResponses(responses: Record<string, unknown>): Record<string, unknown> {
    const alias: Record<string, string> = {
      visualAcuityOd: 'acuiteOD',
      visualAcuityOg: 'acuiteOG',
      acuite_od: 'acuiteOD',
      acuite_og: 'acuiteOG',
      bloodPressureSys: 'taSys',
      bloodPressureDia: 'taDia',
      heartRate: 'fc',
      weight: 'poids',
      height: 'taille',
      oxygenSaturation: 'spo2',
    };
    const out = { ...responses };
    for (const [from, to] of Object.entries(alias)) {
      if (from in out && !(to in out)) {
        out[to] = out[from];
      }
    }
    return out;
  }

  private flattenStructured(raw: unknown): Record<string, unknown> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return { ...(raw as Record<string, unknown>) };
  }

  async vitalsTimeline(user: RequestUser, patientId: string) {
    await this.patientsService.assertCanAccessPatient(user, patientId);
    const where: Prisma.ConsultationWhereInput = {
      patientId,
      status: ConsultationStatus.completed,
    };
    if (
      user.role === UserRole.doctor ||
      user.role === UserRole.secretary ||
      user.role === UserRole.trainee
    ) {
      if (!user.doctorSpaceId) {
        throw new ForbiddenException('Espace cabinet non résolu');
      }
      where.doctorSpaceId = user.doctorSpaceId;
    }

    const rows = await this.prisma.consultation.findMany({
      where,
      orderBy: { closedAt: 'asc' },
      select: {
        id: true,
        closedAt: true,
        createdAt: true,
        structuredData: true,
        specialtyCode: true,
      },
    });

    const points: Array<{
      date: string;
      consultationId: string;
      values: Record<string, number | string | null>;
    }> = [];

    for (const r of rows) {
      const sd = (r.structuredData ?? {}) as Record<string, unknown>;
      const values: Record<string, number | string | null> = {};
      for (const k of VITAL_KEYS) {
        const v = sd[k];
        if (v === undefined || v === null || v === '') continue;
        if (typeof v === 'number') values[k] = v;
        else if (typeof v === 'string') values[k] = v;
      }
      if (Object.keys(values).length === 0) continue;
      points.push({
        date: (r.closedAt ?? r.createdAt).toISOString(),
        consultationId: r.id,
        values,
      });
    }

    return { patientId, points };
  }
}
