import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  AppointmentType,
  AppointmentVisitKind,
  Prisma,
  UserRole,
  PatientInAppNotificationKind,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { scheduleBlockClient } from '@/prisma/schedule-block.client';
import { PatientsService } from '@/modules/patients/patients.service';
import { DoctorsService } from '@/modules/doctors/doctors.service';
import { DoctorsSpaceService } from '@/modules/doctors/doctors-space.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentDoctorDto } from './dto/create-appointment-doctor.dto';
import { UpdateAppointmentDoctorDto } from './dto/update-appointment-doctor.dto';
import { MergeAppointmentsDto } from './dto/merge-appointments.dto';
import { SplitAppointmentDto } from './dto/split-appointment.dto';
import { QueryAppointmentSlotsDto } from './dto/query-appointment-slots.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { PatientPreConsultationDto } from './dto/patient-pre-consultation.dto';
import { ReschedulePatientAppointmentDto } from './dto/reschedule-patient-appointment.dto';
import type { SanitizedUser } from '@/modules/users/users.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import {
  appointmentWhereForCabinetAgenda,
  resolveStaffDoctorSpaceId,
} from '@/common/tenant/doctor-space-scope';
import { SlotLockService } from './slot-lock.service';
import { AppointmentRemindersQueue } from './appointment-reminders.queue';
import { PublicPreConsultService } from '@/modules/public-pre-consult/public-pre-consult.service';

const appointmentInclude = {
  doctor: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          twoFactorEnabled: true,
          phoneNumber: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      specialty: { select: { code: true, name: true } },
    },
  },
  patient: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          twoFactorEnabled: true,
          phoneNumber: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
} satisfies Prisma.AppointmentInclude;

type AppointmentRow = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function startOfLocalDay(ymd: string): Date {
  const [y, mo, da] = ymd.split('-').map((x) => parseInt(x, 10));
  return new Date(y, mo - 1, da, 0, 0, 0, 0);
}

function endOfLocalDayExclusive(ymd: string): Date {
  const d = startOfLocalDay(ymd);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
    private readonly doctorsSpaceService: DoctorsSpaceService,
    private readonly notifications: NotificationsService,
    private readonly slotLock: SlotLockService,
    private readonly remindersQueue: AppointmentRemindersQueue,
    private readonly publicPreConsult: PublicPreConsultService,
  ) {}

  getPublicSlots(dto: QueryAppointmentSlotsDto) {
    const duration = dto.duration ?? undefined;
    return this.doctorsService.getAvailabilityForSite(dto.doctorId, dto.siteId, dto.date, duration);
  }

  async listMine(user: SanitizedUser) {
    if (user.role !== UserRole.patient) {
      throw new ForbiddenException('Patients only');
    }
    const patientId = await this.patientsService.findPatientIdForUser(user.id);
    const rows = await this.prisma.appointment.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { startTime: 'desc' },
      include: appointmentInclude,
    });
    return rows.map((a) => this.serializeAppointment(a));
  }

  async listForUser(
    user: SanitizedUser,
    opts: { from?: string; to?: string; status?: AppointmentStatus },
  ) {
    const where: Prisma.AppointmentWhereInput = { deletedAt: null };
    const st: Prisma.DateTimeFilter = {};
    if (opts.from) st.gte = new Date(opts.from);
    if (opts.to) st.lte = new Date(opts.to);
    if (Object.keys(st).length) where.startTime = st;
    if (opts.status) where.status = opts.status;

    if (user.role === UserRole.patient) {
      const patientId = await this.patientsService.findPatientIdForUser(user.id);
      where.patientId = patientId;
    } else if (user.role === UserRole.doctor || user.role === UserRole.secretary) {
      const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
      where.doctorId = doctorId;
      const spaceId = resolveStaffDoctorSpaceId(user as RequestUser);
      if (spaceId) where.doctorSpaceId = spaceId;
    } else if (user.role === UserRole.admin) {
      /* no extra filter */
    } else {
      throw new ForbiddenException();
    }

    const rows = await this.prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: 200,
      include: appointmentInclude,
    });
    return rows.map((a) => this.serializeAppointment(a));
  }

  async findOneForUser(user: SanitizedUser, appointmentId: string) {
    const row = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      include: appointmentInclude,
    });
    if (!row) throw new NotFoundException('Rendez-vous introuvable');
    await this.assertCanReadAppointment(user, row);
    return this.serializeAppointment(row);
  }

  private patientPreConsultationEditable(status: AppointmentStatus): boolean {
    return (
      status === AppointmentStatus.pending ||
      status === AppointmentStatus.confirmed ||
      status === AppointmentStatus.in_progress
    );
  }

  private serializePatientPreConsultForm(f: {
    id: string;
    responses: Prisma.JsonValue;
    specialtyCode: string | null;
    updatedAt: Date;
  }) {
    return {
      id: f.id,
      responses: f.responses as Record<string, unknown>,
      specialtyCode: f.specialtyCode ?? undefined,
      updatedAt: f.updatedAt.toISOString(),
    };
  }

  async getPatientPreConsultation(user: SanitizedUser, appointmentId: string) {
    if (user.role !== UserRole.patient) {
      throw new ForbiddenException('Accès réservé aux patients');
    }
    const row = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      include: appointmentInclude,
    });
    if (!row) throw new NotFoundException('Rendez-vous introuvable');
    await this.assertCanReadAppointment(user, row);

    const ext = row as AppointmentRow & { doctorSpaceId?: string | null };
    const doctorSpaceId = ext.doctorSpaceId ?? null;
    const specialtyCode = row.doctor.specialtyCode;

    let form: {
      id: string;
      responses: Record<string, unknown>;
      specialtyCode?: string;
      updatedAt: string;
    } | null = null;
    if (row.preConsultationFormId) {
      const f = await this.prisma.preConsultationForm.findUnique({
        where: { id: row.preConsultationFormId },
      });
      if (f) {
        form = this.serializePatientPreConsultForm(f);
      }
    }

    return {
      appointmentId: row.id,
      specialtyCode,
      doctorSpaceId,
      editable: this.patientPreConsultationEditable(row.status),
      form,
    };
  }

  async putPatientPreConsultation(
    user: SanitizedUser,
    appointmentId: string,
    dto: PatientPreConsultationDto,
  ) {
    if (user.role !== UserRole.patient) {
      throw new ForbiddenException('Accès réservé aux patients');
    }
    const patientId = await this.patientsService.findPatientIdForUser(user.id);
    const responsesJson = dto.responses as Prisma.InputJsonValue;

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.appointment.findFirst({
        where: { id: appointmentId, deletedAt: null },
        include: appointmentInclude,
      });
      if (!row) throw new NotFoundException('Rendez-vous introuvable');
      if (row.patientId !== patientId) throw new ForbiddenException();
      if (!this.patientPreConsultationEditable(row.status)) {
        throw new BadRequestException(
          'Ce rendez-vous ne permet plus la modification de la pré-consultation',
        );
      }

      const ext = row as AppointmentRow & { doctorSpaceId?: string | null };
      const doctorSpaceId = ext.doctorSpaceId?.trim();
      if (!doctorSpaceId) {
        throw new BadRequestException(
          'Cabinet non associé à ce rendez-vous — pré-consultation indisponible',
        );
      }
      const specialtyCode = row.doctor.specialtyCode;

      if (row.preConsultationFormId) {
        const existing = await tx.preConsultationForm.findFirst({
          where: { id: row.preConsultationFormId, patientId },
        });
        if (!existing) throw new NotFoundException('Formulaire introuvable');
        const updated = await tx.preConsultationForm.update({
          where: { id: existing.id },
          data: {
            responses: responsesJson,
            ...(existing.specialtyCode == null && specialtyCode
              ? { specialtyCode }
              : {}),
          },
        });
        return { form: this.serializePatientPreConsultForm(updated) };
      }

      const created = await tx.preConsultationForm.create({
        data: {
          patientId,
          doctorSpaceId,
          specialtyCode,
          responses: responsesJson,
        },
      });
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { preConsultationFormId: created.id },
      });
      return { form: this.serializePatientPreConsultForm(created) };
    });
  }

  async rescheduleForPatient(
    user: SanitizedUser,
    appointmentId: string,
    dto: ReschedulePatientAppointmentDto,
  ) {
    if (user.role !== UserRole.patient) {
      throw new ForbiddenException('Accès réservé aux patients');
    }
    const patientId = await this.patientsService.findPatientIdForUser(user.id);
    const row = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null, patientId },
      include: appointmentInclude,
    });
    if (!row) throw new NotFoundException('Rendez-vous introuvable');
    if (row.status !== AppointmentStatus.pending && row.status !== AppointmentStatus.confirmed) {
      throw new BadRequestException(
        'Seuls les rendez-vous en attente ou confirmés peuvent être déplacés',
      );
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startTime');
    }
    if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid endTime');
    }
    if (end <= start) throw new BadRequestException('endTime must be after startTime');

    let siteId = dto.siteId?.trim() ?? (row as AppointmentRow & { doctorSiteId?: string | null }).doctorSiteId ?? undefined;
    if (!siteId) {
      siteId = (await this.doctorsSpaceService.getPrimarySiteIdForDoctor(row.doctorId)) ?? undefined;
    }
    if (!siteId) throw new BadRequestException('siteId requis (aucun site enregistré pour ce praticien)');

    await this.doctorsSpaceService.assertSiteBelongsToDoctor(row.doctorId, siteId);

    const slotDate = dto.slotDate?.trim() || ymdLocal(start);
    const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
    const { slots } = await this.doctorsService.getAvailabilityForSite(
      row.doctorId,
      siteId,
      slotDate,
      durMin,
    );
    const sT = start.getTime();
    const eT = end.getTime();
    const slotOk = slots.some(
      (s) => new Date(s.startTime).getTime() === sT && new Date(s.endTime).getTime() === eT,
    );
    if (!slotOk) {
      throw new BadRequestException('Ce créneau est indisponible ou ne correspond pas à la grille horaire');
    }

    const locked = await this.slotLock.acquire(row.doctorId, siteId, start);
    if (!locked) {
      throw new ConflictException('Ce créneau est déjà en cours de réservation');
    }

    try {
      await this.assertNoOverlap(row.doctorId, start, end, appointmentId);
      await this.assertNoBlockOverlap(row.doctorId, start, end);

      const updated = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          startTime: start,
          endTime: end,
          doctorSiteId: siteId,
        },
        include: appointmentInclude,
      });

      void this.remindersQueue.cancelScheduled(appointmentId).catch(() => undefined);
      void this.remindersQueue.scheduleForAppointment(updated.id, updated.startTime).catch(() => undefined);

      void this.patientsService
        .pushInAppNotification(updated.patientId, {
          kind: PatientInAppNotificationKind.appointment,
          title: 'Rendez-vous déplacé',
          body: `Nouveau créneau : ${updated.startTime.toLocaleString('fr-FR')}.`,
          linkPath: '/dashboard/patient/bookings',
          meta: { appointmentId: updated.id },
        })
        .catch(() => undefined);

      return this.serializeAppointment(updated);
    } finally {
      await this.slotLock.release(row.doctorId, siteId, start);
    }
  }

  async listDoctorDay(user: SanitizedUser, doctorId: string, dateYmd: string) {
    await this.assertDoctorAgendaAccess(user, doctorId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) throw new BadRequestException('date invalide (YYYY-MM-DD)');
    const start = startOfLocalDay(dateYmd);
    const end = endOfLocalDayExclusive(dateYmd);
    const spaceId = resolveStaffDoctorSpaceId(user as RequestUser);
    const rows = await this.prisma.appointment.findMany({
      where: appointmentWhereForCabinetAgenda(doctorId, spaceId!, {
        startTime: { gte: start, lt: end },
      }),
      orderBy: { startTime: 'asc' },
      include: appointmentInclude,
    });
    return rows.map((a) => this.serializeAppointment(a));
  }

  async listDoctorWeek(user: SanitizedUser, doctorId: string, weekStartYmd: string) {
    await this.assertDoctorAgendaAccess(user, doctorId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartYmd)) throw new BadRequestException('weekStart invalide (YYYY-MM-DD)');
    const start = startOfLocalDay(weekStartYmd);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, 0, 0, 0, 0);
    const spaceId = resolveStaffDoctorSpaceId(user as RequestUser);
    const rows = await this.prisma.appointment.findMany({
      where: appointmentWhereForCabinetAgenda(doctorId, spaceId!, {
        startTime: { gte: start, lt: end },
      }),
      orderBy: { startTime: 'asc' },
      include: appointmentInclude,
    });
    return rows.map((a) => this.serializeAppointment(a));
  }

  private async assertDoctorAgendaAccess(user: SanitizedUser, doctorId: string) {
    if (user.role === UserRole.doctor) {
      const mine = await this.doctorsService.findDoctorIdForUser(user.id);
      if (mine !== doctorId) throw new ForbiddenException();
    } else if (user.role === UserRole.secretary) {
      const theirs = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
      if (theirs !== doctorId) throw new ForbiddenException();
    } else {
      throw new ForbiddenException();
    }
    const spaceId = resolveStaffDoctorSpaceId(user as RequestUser);
    const space = await this.prisma.doctorSpace.findUnique({
      where: { doctorId },
      select: { id: true },
    });
    if (!space || space.id !== spaceId) {
      throw new ForbiddenException('Agenda hors de votre espace cabinet');
    }
  }

  private async assertCanReadAppointment(user: SanitizedUser, row: AppointmentRow) {
    if (user.role === UserRole.admin) return;
    if (user.role === UserRole.patient) {
      const pid = await this.patientsService.findPatientIdForUser(user.id);
      if (row.patientId !== pid) throw new ForbiddenException();
      return;
    }
    if (user.role === UserRole.doctor || user.role === UserRole.secretary) {
      const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
      if (row.doctorId !== doctorId) throw new ForbiddenException();
      const spaceId = resolveStaffDoctorSpaceId(user as RequestUser);
      const ext = row as AppointmentRow & { doctorSpaceId?: string | null };
      if (spaceId && ext.doctorSpaceId && ext.doctorSpaceId !== spaceId) {
        throw new ForbiddenException();
      }
      return;
    }
    throw new ForbiddenException();
  }

  private async assertNoOverlap(
    doctorId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ) {
    const clash = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        deletedAt: null,
        status: { not: AppointmentStatus.cancelled },
        id: excludeId ? { not: excludeId } : undefined,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (clash) throw new BadRequestException('Chevauchement avec un autre rendez-vous');
  }

  private async assertNoBlockOverlap(doctorId: string, start: Date, end: Date) {
    const block = await scheduleBlockClient(this.prisma).findFirst({
      where: {
        doctorId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (block) throw new BadRequestException('Période fermée ou absence médecin sur ce créneau');
  }

  async createForPatient(user: SanitizedUser, dto: CreateAppointmentDto) {
    if (user.role !== UserRole.patient && user.role !== UserRole.secretary) {
      throw new ForbiddenException();
    }

    let patientId: string;
    if (user.role === UserRole.patient) {
      patientId = await this.patientsService.findPatientIdForUser(user.id);
    } else {
      if (!dto.patientId?.trim()) throw new BadRequestException('patientId requis pour la secrétaire');
      await this.doctorsService.resolveDoctorIdForAgendaUser(user);
      const link = await this.prisma.secretaryDoctorSpace.findUnique({
        where: { userId: user.id },
        include: { doctorSpace: { include: { doctor: true } } },
      });
      if (!link || link.doctorSpace.doctor.id !== dto.doctorId) {
        throw new ForbiddenException('Médecin non couvert par votre cabinet');
      }
      const p = await this.prisma.patient.findFirst({
        where: { id: dto.patientId, deletedAt: null },
      });
      if (!p) throw new NotFoundException('Patient introuvable');
      patientId = dto.patientId;
    }

    const doctor = await this.prisma.doctor.findFirst({
      where: { id: dto.doctorId, deletedAt: null },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid startTime');
    }
    if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid endTime');
    }
    if (end <= start) throw new BadRequestException('endTime must be after startTime');

    let siteId = dto.siteId?.trim();
    if (!siteId) {
      siteId = (await this.doctorsSpaceService.getPrimarySiteIdForDoctor(dto.doctorId)) ?? undefined;
    }
    if (!siteId) throw new BadRequestException('siteId requis (aucun site enregistré pour ce praticien)');

    await this.doctorsSpaceService.assertSiteBelongsToDoctor(dto.doctorId, siteId);

    const slotDate = dto.slotDate ?? ymdLocal(start);
    const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
    const { slots } = await this.doctorsService.getAvailabilityForSite(
      dto.doctorId,
      siteId,
      slotDate,
      durMin,
    );
    const sT = start.getTime();
    const eT = end.getTime();
    const slotOk = slots.some(
      (s) => new Date(s.startTime).getTime() === sT && new Date(s.endTime).getTime() === eT,
    );
    if (!slotOk) {
      throw new BadRequestException('Ce créneau est indisponible ou ne correspond pas à la grille horaire');
    }

    const locked = await this.slotLock.acquire(dto.doctorId, siteId, start);
    if (!locked) {
      throw new ConflictException('Ce créneau est déjà en cours de réservation');
    }

    try {
      await this.assertNoOverlap(dto.doctorId, start, end);
      await this.assertNoBlockOverlap(dto.doctorId, start, end);

      const spaceId = await this.doctorsSpaceService.getDoctorSpaceIdForDoctor(dto.doctorId);

      let visitKind = dto.visitKind ?? AppointmentVisitKind.new_visit;
      let apptType = dto.type ?? AppointmentType.in_person;
      if (visitKind === AppointmentVisitKind.teleconsult) {
        apptType = AppointmentType.video;
      }

      const row = await this.prisma.appointment.create({
        data: {
          doctorId: dto.doctorId,
          patientId,
          doctorSpaceId: spaceId ?? undefined,
          doctorSiteId: siteId,
          startTime: start,
          endTime: end,
          reason: dto.reason,
          type: apptType,
          visitKind,
          status: AppointmentStatus.pending,
          familyMemberId: dto.familyMemberId ?? undefined,
          preConsultationFormId: dto.preConsultationFormId ?? undefined,
        },
        include: appointmentInclude,
      });

      void this.remindersQueue.scheduleForAppointment(row.id, row.startTime).catch(() => undefined);

      const out = this.serializeAppointment(row);
      const patientUser = row.patient.user!;
      const doctorUser = row.doctor.user!;
      await this.notifications.sendAppointmentEvent({
        kind: 'booked',
        toEmail: patientUser.email,
        toPhone: patientUser.phoneNumber ?? undefined,
        smsBody: `RDV demandé le ${row.startTime.toLocaleString('fr-FR')} — en attente confirmation.`,
        subject: 'Confirmation de demande de rendez-vous',
        body: `Votre rendez-vous avec Dr. ${doctorUser.lastName ?? ''} est en attente de confirmation.`,
        meta: { appointmentId: row.id },
      });
      if (doctorUser.email) {
        await this.notifications.sendAppointmentEvent({
          kind: 'booked',
          toEmail: doctorUser.email,
          toPhone: doctorUser.phoneNumber ?? undefined,
          smsBody: `Nouveau RDV patient le ${row.startTime.toLocaleString('fr-FR')}.`,
          subject: 'Nouvelle demande de rendez-vous',
          body: `Un rendez-vous a été réservé pour le ${row.startTime.toISOString()}.`,
          meta: { appointmentId: row.id },
        });
      }
      void this.patientsService
        .pushInAppNotification(row.patientId, {
          kind: PatientInAppNotificationKind.appointment,
          title: 'Rendez-vous enregistré',
          body: `Demande pour le ${row.startTime.toLocaleString('fr-FR')} — en attente de confirmation du cabinet.`,
          linkPath: '/dashboard/patient/bookings',
          meta: { appointmentId: row.id },
        })
        .catch(() => undefined);
      return out;
    } finally {
      await this.slotLock.release(dto.doctorId, siteId, start);
    }
  }

  async cancelMine(user: SanitizedUser, appointmentId: string, dto?: CancelAppointmentDto) {
    return this.cancelAppointment(user, appointmentId, dto);
  }

  async cancelAppointment(user: SanitizedUser, appointmentId: string, dto?: CancelAppointmentDto) {
    const row = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      include: appointmentInclude,
    });
    if (!row) throw new NotFoundException('Appointment not found');

    if (user.role === UserRole.patient) {
      const patientId = await this.patientsService.findPatientIdForUser(user.id);
      if (row.patientId !== patientId) throw new ForbiddenException();
    } else if (user.role === UserRole.doctor || user.role === UserRole.secretary) {
      const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
      if (row.doctorId !== doctorId) throw new ForbiddenException();
    } else {
      throw new ForbiddenException();
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.cancelled,
        cancelReason: dto?.cancelReason ?? undefined,
        cancelledByUserId: user.id,
      },
    });

    void this.remindersQueue.cancelScheduled(appointmentId).catch(() => undefined);

    const du = row.doctor.user;
    const pu = row.patient.user;
    const when = row.startTime.toISOString();
    if (du?.email) {
      await this.notifications.sendAppointmentEvent({
        kind: 'cancelled',
        toEmail: du.email,
        toPhone: du.phoneNumber ?? undefined,
        smsBody: `Annulation RDV ${when}.`,
        subject: 'Annulation rendez-vous',
        body: `Le rendez-vous du ${when} a été annulé.`,
        meta: { appointmentId },
      });
    }
    if (pu?.email) {
      await this.notifications.sendAppointmentEvent({
        kind: 'cancelled',
        toEmail: pu.email,
        toPhone: pu.phoneNumber ?? undefined,
        smsBody: `Votre RDV du ${when} est annulé.`,
        subject: 'Annulation rendez-vous',
        body: `Votre rendez-vous du ${when} a été annulé.`,
        meta: { appointmentId },
      });
    }
    void this.patientsService
      .pushInAppNotification(row.patientId, {
        kind: PatientInAppNotificationKind.appointment,
        title: 'Rendez-vous annulé',
        body: `Le créneau du ${row.startTime.toLocaleString('fr-FR')} a été annulé.`,
        linkPath: '/dashboard/patient/bookings',
        meta: { appointmentId },
      })
      .catch(() => undefined);
    return { id: appointmentId, status: AppointmentStatus.cancelled };
  }

  private async requireDoctorAppointment(
    user: SanitizedUser,
    appointmentId: string,
  ): Promise<AppointmentRow> {
    if (user.role !== UserRole.doctor && user.role !== UserRole.secretary) {
      throw new ForbiddenException('Médecins ou secrétaires uniquement');
    }
    const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
    const row = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId, deletedAt: null },
      include: appointmentInclude,
    });
    if (!row) throw new NotFoundException('Rendez-vous introuvable');
    return row;
  }

  async confirmByStaff(user: SanitizedUser, appointmentId: string) {
    const row = await this.requireDoctorAppointment(user, appointmentId);
    if (row.status === AppointmentStatus.cancelled) throw new BadRequestException('RDV annulé');
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.confirmed },
      include: appointmentInclude,
    });
    void this.patientsService
      .syncPatientDoctorAccessFromAppointment({
        patientId: updated.patientId,
        doctorId: updated.doctorId,
        startTime: updated.startTime,
        status: updated.status,
      })
      .catch(() => undefined);
    void this.remindersQueue.scheduleForAppointment(updated.id, updated.startTime).catch(() => undefined);
    const pu = updated.patient.user!;
    await this.notifications.sendAppointmentEvent({
      kind: 'updated',
      toEmail: pu.email,
      toPhone: pu.phoneNumber ?? undefined,
      smsBody: `Votre RDV du ${updated.startTime.toLocaleString('fr-FR')} est confirmé.`,
      subject: 'Rendez-vous confirmé',
      body: `Votre rendez-vous du ${updated.startTime.toISOString()} est confirmé.`,
      meta: { appointmentId },
    });
    void this.patientsService
      .pushInAppNotification(updated.patientId, {
        kind: PatientInAppNotificationKind.appointment,
        title: 'Rendez-vous confirmé',
        body: `Votre créneau du ${updated.startTime.toLocaleString('fr-FR')} est confirmé.`,
        linkPath: '/dashboard/patient/bookings',
        meta: { appointmentId: updated.id },
      })
      .catch(() => undefined);
    return this.serializeAppointment(updated);
  }

  async markNoShow(user: SanitizedUser, appointmentId: string) {
    await this.requireDoctorAppointment(user, appointmentId);
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.no_show },
    });
    void this.remindersQueue.cancelScheduled(appointmentId).catch(() => undefined);
    return { id: appointmentId, status: AppointmentStatus.no_show };
  }

  async checkInBySecretary(user: SanitizedUser, appointmentId: string) {
    if (user.role !== UserRole.secretary) throw new ForbiddenException('Secrétaires uniquement');
    await this.requireDoctorAppointment(user, appointmentId);
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.confirmed },
      include: appointmentInclude,
    });
    void this.remindersQueue.scheduleForAppointment(updated.id, updated.startTime).catch(() => undefined);
    void this.patientsService
      .pushInAppNotification(updated.patientId, {
        kind: PatientInAppNotificationKind.appointment,
        title: 'Rendez-vous confirmé',
        body: `Votre créneau du ${updated.startTime.toLocaleString('fr-FR')} est confirmé (accueil cabinet).`,
        linkPath: '/dashboard/patient/bookings',
        meta: { appointmentId: updated.id },
      })
      .catch(() => undefined);
    return this.serializeAppointment(updated);
  }

  /** Envoie au patient le lien du questionnaire pré-consultation (médecin ou secrétaire). */
  async sendPreConsultationLink(user: SanitizedUser, appointmentId: string) {
    if (user.role !== UserRole.doctor && user.role !== UserRole.secretary) {
      throw new ForbiddenException('Médecins ou secrétaires uniquement');
    }
    const row = await this.requireDoctorAppointment(user, appointmentId);
    if (!this.patientPreConsultationEditable(row.status)) {
      throw new BadRequestException(
        'Ce rendez-vous ne permet plus d’envoyer le questionnaire pré-consultation',
      );
    }
    const doctorSpaceId = row.doctorSpaceId?.trim();
    if (!doctorSpaceId) {
      throw new BadRequestException('Cabinet non associé à ce rendez-vous');
    }

    let formId = row.preConsultationFormId;
    if (!formId) {
      const created = await this.prisma.preConsultationForm.create({
        data: {
          patientId: row.patientId,
          doctorSpaceId,
          specialtyCode: row.doctor.specialtyCode,
          responses: {},
        },
      });
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { preConsultationFormId: created.id },
      });
      formId = created.id;
    }

    const publicToken = await this.publicPreConsult.ensurePublicToken(formId);
    const linkPathPatient = `/dashboard/patient/bookings/${appointmentId}/pre-consultation`;
    const publicLinkPath = `/pre-consultation/${publicToken}`;
    const when = row.startTime.toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await this.patientsService.pushInAppNotification(row.patientId, {
      kind: PatientInAppNotificationKind.appointment,
      title: 'Questionnaire pré-consultation',
      body: `Merci de compléter votre questionnaire avant le rendez-vous du ${when}.`,
      linkPath: linkPathPatient,
      meta: { appointmentId, preConsultationFormId: formId, publicToken },
    });

    const pu = row.patient.user;
    if (pu?.email) {
      const front = process.env.FRONTEND_URL || 'http://localhost:3000';
      await this.notifications.sendAppointmentEvent({
        kind: 'updated',
        toEmail: pu.email,
        toPhone: pu.phoneNumber ?? undefined,
        subject: 'Questionnaire pré-consultation',
        body: `Bonjour,\n\nVeuillez compléter votre questionnaire avant votre rendez-vous du ${when}.\n\nLien direct (sans connexion) :\n${front}${publicLinkPath}\n\nOu via votre espace patient :\n${front}${linkPathPatient}\n\nCordialement,\nVotre cabinet`,
        smsBody: `OphthoCare : pré-consultation RDV du ${when} — ${front}${publicLinkPath}`,
        meta: { appointmentId, preConsultationFormId: formId, publicToken },
      });
    }

    return {
      appointmentId,
      preConsultationFormId: formId,
      linkPath: linkPathPatient,
      publicLinkPath,
      publicToken,
      sent: true,
    };
  }

  async startConsultation(user: SanitizedUser, appointmentId: string) {
    if (user.role !== UserRole.doctor) throw new ForbiddenException('Médecins uniquement');
    await this.requireDoctorAppointment(user, appointmentId);
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.in_progress },
      include: appointmentInclude,
    });
    return this.serializeAppointment(updated);
  }

  async completeConsultation(user: SanitizedUser, appointmentId: string) {
    if (user.role !== UserRole.doctor) throw new ForbiddenException('Médecins uniquement');
    await this.requireDoctorAppointment(user, appointmentId);
    const row = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.completed },
      include: appointmentInclude,
    });
    void this.patientsService
      .syncPatientDoctorAccessFromAppointment({
        patientId: row.patientId,
        doctorId: row.doctorId,
        startTime: row.startTime,
        status: row.status,
      })
      .catch(() => undefined);
    void this.remindersQueue.cancelScheduled(appointmentId).catch(() => undefined);
    return this.serializeAppointment(row);
  }

  async updateByDoctor(user: SanitizedUser, appointmentId: string, dto: UpdateAppointmentDoctorDto) {
    const row = await this.requireDoctorAppointment(user, appointmentId);
    const start = dto.startTime ? new Date(dto.startTime) : row.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : row.endTime;
    if (end <= start) throw new BadRequestException('endTime doit être après startTime');

    if (dto.startTime || dto.endTime) {
      await this.assertNoOverlap(row.doctorId, start, end, appointmentId);
      await this.assertNoBlockOverlap(row.doctorId, start, end);
    }

    const data: Prisma.AppointmentUpdateInput = {};
    if (dto.startTime) data.startTime = start;
    if (dto.endTime) data.endTime = end;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.reason !== undefined) data.reason = dto.reason;

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data,
      include: appointmentInclude,
    });
    void this.patientsService
      .syncPatientDoctorAccessFromAppointment({
        patientId: updated.patientId,
        doctorId: updated.doctorId,
        startTime: updated.startTime,
        status: updated.status,
      })
      .catch(() => undefined);
    if (dto.startTime || dto.endTime) {
      void this.remindersQueue.cancelScheduled(appointmentId).catch(() => undefined);
      void this.remindersQueue.scheduleForAppointment(updated.id, updated.startTime).catch(() => undefined);
    }
    return this.serializeAppointment(updated);
  }

  async createByDoctor(user: SanitizedUser, dto: CreateAppointmentDoctorDto) {
    if (user.role !== UserRole.doctor && user.role !== UserRole.secretary) {
      throw new ForbiddenException('Médecins ou secrétaires uniquement');
    }
    const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (end <= start) throw new BadRequestException('endTime doit être après startTime');
    const durMin = (end.getTime() - start.getTime()) / 60000;
    if (durMin < 15 || durMin > 240) throw new BadRequestException('Durée entre 15 min et 4 h');

    await this.assertNoOverlap(doctorId, start, end);
    await this.assertNoBlockOverlap(doctorId, start, end);

    let siteId = dto.siteId?.trim();
    if (!siteId) {
      siteId = (await this.doctorsSpaceService.getPrimarySiteIdForDoctor(doctorId)) ?? undefined;
    }
    const spaceId = await this.doctorsSpaceService.getDoctorSpaceIdForDoctor(doctorId);

    let visitKind = dto.visitKind ?? AppointmentVisitKind.new_visit;
    let apptType = dto.type ?? AppointmentType.in_person;
    if (visitKind === AppointmentVisitKind.teleconsult) apptType = AppointmentType.video;

    const row = await this.prisma.appointment.create({
      data: {
        doctorId,
        patientId: dto.patientId,
        doctorSpaceId: spaceId ?? undefined,
        doctorSiteId: siteId,
        startTime: start,
        endTime: end,
        reason: dto.reason,
        type: apptType,
        visitKind,
        status: AppointmentStatus.confirmed,
      },
      include: appointmentInclude,
    });
    void this.remindersQueue.scheduleForAppointment(row.id, row.startTime).catch(() => undefined);
    void this.patientsService
      .syncPatientDoctorAccessFromAppointment({
        patientId: row.patientId,
        doctorId: row.doctorId,
        startTime: row.startTime,
        status: row.status,
      })
      .catch(() => undefined);
    return this.serializeAppointment(row);
  }

  async mergeByDoctor(user: SanitizedUser, body: MergeAppointmentsDto) {
    const a = await this.requireDoctorAppointment(user, body.keepId);
    const b = await this.requireDoctorAppointment(user, body.removeId);
    if (a.id === b.id) throw new BadRequestException('Identiques');
    const start = a.startTime < b.startTime ? a.startTime : b.startTime;
    const end = a.endTime > b.endTime ? a.endTime : b.endTime;

    const third = await this.prisma.appointment.findFirst({
      where: {
        doctorId: a.doctorId,
        deletedAt: null,
        status: { not: AppointmentStatus.cancelled },
        id: { notIn: [a.id, b.id] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (third) throw new BadRequestException('Un autre rendez-vous occupe cette plage');
    await this.assertNoBlockOverlap(a.doctorId, start, end);

    await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: b.id },
        data: { status: AppointmentStatus.cancelled, notes: `Fusionné dans ${a.id}` },
      }),
      this.prisma.appointment.update({
        where: { id: a.id },
        data: { startTime: start, endTime: end },
      }),
    ]);
    const merged = await this.prisma.appointment.findFirst({
      where: { id: a.id },
      include: appointmentInclude,
    });
    return this.serializeAppointment(merged!);
  }

  async splitByDoctor(user: SanitizedUser, appointmentId: string, dto: SplitAppointmentDto) {
    const row = await this.requireDoctorAppointment(user, appointmentId);
    const splitAt = new Date(dto.splitAt);
    if (splitAt <= row.startTime || splitAt >= row.endTime) {
      throw new BadRequestException('splitAt doit être strictement entre début et fin du RDV');
    }

    await this.assertNoOverlap(row.doctorId, splitAt, row.endTime, row.id);
    await this.assertNoBlockOverlap(row.doctorId, splitAt, row.endTime);

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { endTime: splitAt },
      });
      await tx.appointment.create({
        data: {
          doctorId: row.doctorId,
          patientId: row.patientId,
          doctorSpaceId: (row as { doctorSpaceId?: string | null }).doctorSpaceId ?? undefined,
          doctorSiteId: (row as { doctorSiteId?: string | null }).doctorSiteId ?? undefined,
          startTime: splitAt,
          endTime: row.endTime,
          type: row.type,
          visitKind: (row as { visitKind?: AppointmentVisitKind }).visitKind ?? AppointmentVisitKind.new_visit,
          status: AppointmentStatus.pending,
          reason: row.reason,
          notes: `Scission depuis ${appointmentId}`,
        },
      });
    });

    const first = await this.prisma.appointment.findFirst({
      where: { id: appointmentId },
      include: appointmentInclude,
    });
    return this.serializeAppointment(first!);
  }

  async sendReminder(user: SanitizedUser, appointmentId: string) {
    await this.requireDoctorAppointment(user, appointmentId);
    const row = await this.prisma.appointment.findFirst({
      where: { id: appointmentId },
      include: appointmentInclude,
    });
    if (!row) throw new NotFoundException('Rendez-vous introuvable');
    const pu = row.patient.user!;
    await this.notifications.sendAppointmentEvent({
      kind: 'reminder',
      toEmail: pu.email,
      toPhone: pu.phoneNumber ?? undefined,
      smsBody: `Rappel : RDV le ${row.startTime.toLocaleString('fr-FR')}.`,
      subject: 'Rappel rendez-vous',
      body: `Rappel : rendez-vous le ${row.startTime.toISOString()}.`,
      meta: { appointmentId },
    });
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { reminderSent: true },
    });
    return { id: appointmentId, reminderSent: true };
  }

  private serializeAppointment(row: AppointmentRow) {
    const doc = row.doctor;
    const du = doc.user!;
    const pat = row.patient;
    const pu = pat.user!;

    const typeApi =
      row.type === AppointmentType.in_person ? 'in-person' : 'video';

    const ext = row as AppointmentRow & {
      visitKind?: AppointmentVisitKind;
      doctorSiteId?: string | null;
      doctorSpaceId?: string | null;
      cancelReason?: string | null;
      cancelledByUserId?: string | null;
    };

    return {
      id: row.id,
      startTime: row.startTime.toISOString(),
      endTime: row.endTime.toISOString(),
      status: row.status,
      type: typeApi,
      preConsultationFormId: row.preConsultationFormId ?? undefined,
      visitKind: ext.visitKind ?? AppointmentVisitKind.new_visit,
      siteId: ext.doctorSiteId ?? undefined,
      doctorSpaceId: ext.doctorSpaceId ?? undefined,
      reason: row.reason ?? undefined,
      notes: row.notes ?? undefined,
      reminderSent: row.reminderSent,
      cancelReason: ext.cancelReason ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      doctor: {
        id: doc.id,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        specialtyCode: doc.specialtyCode,
        specialtyName: doc.specialty.name,
        subSpecialties: doc.subSpecialties
          ? doc.subSpecialties
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        licenseNumber: doc.licenseNumber ?? undefined,
        bio: doc.bio ?? undefined,
        rating: Number(doc.rating),
        reviewCount: doc.reviewCount,
        city: doc.city,
        street: doc.street,
        postalCode: doc.postalCode,
        latitude: doc.latitude != null ? Number(doc.latitude) : undefined,
        longitude: doc.longitude != null ? Number(doc.longitude) : undefined,
        consultationPrice: Number(doc.consultationPrice),
        workingHours: (doc.workingHours as Record<string, unknown>) ?? {},
        isVerified: doc.isVerified,
        user: {
          id: du.id,
          email: du.email,
          firstName: du.firstName ?? undefined,
          lastName: du.lastName ?? undefined,
          role: du.role,
          phoneNumber: du.phoneNumber ?? undefined,
          isActive: du.isActive,
          twoFactorEnabled: du.twoFactorEnabled,
          createdAt: du.createdAt.toISOString(),
          updatedAt: du.updatedAt.toISOString(),
        },
      },
      patient: {
        id: pat.id,
        createdAt: pat.createdAt.toISOString(),
        updatedAt: pat.updatedAt.toISOString(),
        user: {
          id: pu.id,
          email: pu.email,
          firstName: pu.firstName ?? undefined,
          lastName: pu.lastName ?? undefined,
          role: pu.role,
          phoneNumber: pu.phoneNumber ?? undefined,
          isActive: pu.isActive,
          twoFactorEnabled: pu.twoFactorEnabled,
          createdAt: pu.createdAt.toISOString(),
          updatedAt: pu.updatedAt.toISOString(),
        },
      },
    };
  }
}
