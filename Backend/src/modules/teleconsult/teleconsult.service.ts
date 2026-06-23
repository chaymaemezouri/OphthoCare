import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  AppointmentType,
  PatientInAppNotificationKind,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AppointmentsService } from '@/modules/appointments/appointments.service';
import { PatientsService } from '@/modules/patients/patients.service';
import { DoctorsService } from '@/modules/doctors/doctors.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { TeleconsultChatDto } from './dto/teleconsult-chat.dto';
import { TeleconsultSignalDto } from './dto/teleconsult-signal.dto';

type ParticipantRole = 'doctor' | 'patient';

type ChatMessage = {
  id: string;
  senderRole: ParticipantRole;
  senderName: string;
  body: string;
  createdAt: string;
};

type SignalMessage = {
  seq: number;
  from: ParticipantRole;
  type: TeleconsultSignalDto['type'];
  payload: Record<string, unknown>;
  createdAt: string;
};

type RoomState = {
  appointmentId: string;
  chat: ChatMessage[];
  signals: SignalMessage[];
  chatSeq: number;
  signalSeq: number;
  startedAt: string;
  endedAt?: string;
};

@Injectable()
export class TeleconsultService {
  private readonly rooms = new Map<string, RoomState>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentsService: AppointmentsService,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
  ) {}

  private roleForUser(user: RequestUser): ParticipantRole {
    if (user.role === UserRole.patient) return 'patient';
    if (user.role === UserRole.doctor || user.role === UserRole.secretary || user.role === UserRole.admin) {
      return 'doctor';
    }
    throw new ForbiddenException('Accès refusé');
  }

  private async assertVideoAppointment(user: RequestUser, appointmentId: string) {
    const row = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      include: {
        patient: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Rendez-vous introuvable');
    if (row.type !== AppointmentType.video) {
      throw new BadRequestException('Ce rendez-vous n’est pas une téléconsultation (type visio).');
    }

    if (user.role === UserRole.patient) {
      const pid = await this.patientsService.findPatientIdForUser(user.id);
      if (row.patientId !== pid) throw new ForbiddenException('Accès refusé');
    } else if (user.role === UserRole.doctor || user.role === UserRole.secretary) {
      const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
      if (row.doctorId !== doctorId) throw new ForbiddenException('Accès refusé');
    } else if (user.role !== UserRole.admin) {
      throw new ForbiddenException('Accès refusé');
    }

    return row;
  }

  private getOrCreateRoom(appointmentId: string): RoomState {
    let room = this.rooms.get(appointmentId);
    if (!room) {
      room = {
        appointmentId,
        chat: [],
        signals: [],
        chatSeq: 0,
        signalSeq: 0,
        startedAt: new Date().toISOString(),
      };
      this.rooms.set(appointmentId, room);
    }
    return room;
  }

  private patientDisplayName(row: {
    patient: {
      user: { firstName: string | null; lastName: string | null; email: string } | null;
    };
  }) {
    const u = row.patient.user;
    if (!u) return 'Patient';
    return [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email || 'Patient';
  }

  async listVideoAppointments(user: RequestUser, dateYmd?: string) {
    if (user.role !== UserRole.doctor && user.role !== UserRole.secretary && user.role !== UserRole.admin) {
      throw new ForbiddenException('Médecins ou secrétaires uniquement');
    }
    const doctorId = await this.doctorsService.resolveDoctorIdForAgendaUser(user);
    const date = dateYmd?.trim() || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('date invalide (YYYY-MM-DD)');

    const [y, m, d] = date.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);

    const rows = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        type: AppointmentType.video,
        status: { not: AppointmentStatus.cancelled },
        startTime: { gte: start, lt: end },
      },
      orderBy: { startTime: 'asc' },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      startTime: r.startTime.toISOString(),
      endTime: r.endTime.toISOString(),
      status: r.status,
      reason: r.reason ?? undefined,
      patientId: r.patientId,
      patientDisplayName: this.patientDisplayName(r),
      hasActiveRoom: this.rooms.has(r.id) && !this.rooms.get(r.id)?.endedAt,
    }));
  }

  async getContext(user: RequestUser, appointmentId: string) {
    const row = await this.assertVideoAppointment(user, appointmentId);
    const room = this.rooms.get(appointmentId);
    const patientName = this.patientDisplayName(row);
    const age =
      row.patient.dateOfBirth != null
        ? Math.floor(
            (Date.now() - row.patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
          )
        : null;

    return {
      appointment: {
        id: row.id,
        startTime: row.startTime.toISOString(),
        endTime: row.endTime.toISOString(),
        status: row.status,
        reason: row.reason ?? undefined,
        notes: row.notes ?? undefined,
      },
      patient: {
        id: row.patientId,
        displayName: patientName,
        dateOfBirth: row.patient.dateOfBirth?.toISOString().slice(0, 10) ?? null,
        age,
        allergies: row.patient.allergies ?? [],
        antecedents: row.patient.antecedents ?? [],
      },
      room: room
        ? {
            startedAt: room.startedAt,
            endedAt: room.endedAt ?? null,
            chatCount: room.chat.length,
          }
        : null,
      myRole: this.roleForUser(user),
    };
  }

  async join(user: RequestUser, appointmentId: string) {
    const row = await this.assertVideoAppointment(user, appointmentId);
    if (row.status === AppointmentStatus.cancelled) {
      throw new BadRequestException('Rendez-vous annulé');
    }
    const room = this.getOrCreateRoom(appointmentId);
    if (room.endedAt) {
      throw new BadRequestException('Séance terminée par le médecin');
    }
    const role = this.roleForUser(user);

    if (role === 'doctor' && row.status === AppointmentStatus.confirmed) {
      try {
        await this.appointmentsService.startConsultation(user, appointmentId);
      } catch {
        /* déjà en cours ou statut incompatible */
      }
    }

    if (role === 'patient') {
      void this.patientsService
        .pushInAppNotification(row.patientId, {
          kind: PatientInAppNotificationKind.appointment,
          title: 'Connexion à la téléconsultation',
          body: 'Vous avez rejoint la salle de visio.',
          linkPath: `/dashboard/patient/teleconsult/${appointmentId}`,
          meta: { appointmentId },
        })
        .catch(() => undefined);
    }

    return {
      appointmentId,
      role,
      startedAt: room.startedAt,
      chat: room.chat,
      signalCursor: room.signalSeq,
    };
  }

  async listChat(user: RequestUser, appointmentId: string, after?: string) {
    await this.assertVideoAppointment(user, appointmentId);
    const room = this.rooms.get(appointmentId);
    if (!room) return { messages: [] as ChatMessage[] };
    if (!after) return { messages: room.chat };
    const idx = room.chat.findIndex((m) => m.id === after);
    if (idx < 0) return { messages: room.chat };
    return { messages: room.chat.slice(idx + 1) };
  }

  async sendChat(user: RequestUser, appointmentId: string, dto: TeleconsultChatDto) {
    const row = await this.assertVideoAppointment(user, appointmentId);
    const room = this.getOrCreateRoom(appointmentId);
    if (room.endedAt) throw new BadRequestException('Séance terminée');

    const role = this.roleForUser(user);
    const senderName =
      role === 'doctor'
        ? [row.doctor.user?.firstName, row.doctor.user?.lastName].filter(Boolean).join(' ').trim() ||
          'Médecin'
        : this.patientDisplayName(row);

    const msg: ChatMessage = {
      id: `c-${++room.chatSeq}`,
      senderRole: role,
      senderName,
      body: dto.body.trim(),
      createdAt: new Date().toISOString(),
    };
    room.chat.push(msg);
    return msg;
  }

  async postSignal(user: RequestUser, appointmentId: string, dto: TeleconsultSignalDto) {
    await this.assertVideoAppointment(user, appointmentId);
    const room = this.getOrCreateRoom(appointmentId);
    if (room.endedAt && dto.type !== 'hangup') {
      throw new BadRequestException('Séance terminée');
    }
    const role = this.roleForUser(user);
    const sig: SignalMessage = {
      seq: ++room.signalSeq,
      from: role,
      type: dto.type,
      payload: dto.payload,
      createdAt: new Date().toISOString(),
    };
    room.signals.push(sig);
    return { seq: sig.seq };
  }

  async pollSignals(user: RequestUser, appointmentId: string, afterSeq?: number) {
    await this.assertVideoAppointment(user, appointmentId);
    const room = this.rooms.get(appointmentId);
    if (!room) return { signals: [] as SignalMessage[], ended: false };
    const cursor = afterSeq ?? 0;
    const signals = room.signals.filter((s) => s.seq > cursor);
    return { signals, ended: !!room.endedAt };
  }

  async endSession(user: RequestUser, appointmentId: string, notes?: string) {
    if (user.role !== UserRole.doctor && user.role !== UserRole.admin) {
      throw new ForbiddenException('Seul le médecin peut clôturer la séance');
    }
    const row = await this.assertVideoAppointment(user, appointmentId);
    const room = this.getOrCreateRoom(appointmentId);
    room.endedAt = new Date().toISOString();
    room.signals.push({
      seq: ++room.signalSeq,
      from: 'doctor',
      type: 'hangup',
      payload: {},
      createdAt: room.endedAt,
    });

    if (notes?.trim()) {
      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { notes: notes.trim() },
      });
    }

    try {
      if (row.status === AppointmentStatus.in_progress || row.status === AppointmentStatus.confirmed) {
        await this.appointmentsService.completeConsultation(user, appointmentId);
      }
    } catch {
      /* ignore */
    }

    void this.patientsService
      .pushInAppNotification(row.patientId, {
        kind: PatientInAppNotificationKind.appointment,
        title: 'Téléconsultation terminée',
        body: 'Votre médecin a mis fin à la visio. Consultez vos documents et messages.',
        linkPath: '/dashboard/patient/bookings',
        meta: { appointmentId },
      })
      .catch(() => undefined);

    return { ended: true, appointmentId };
  }
}
