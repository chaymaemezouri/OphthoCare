import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdatePatientMeDto } from './dto/update-patient-me.dto';
import { UpdatePatientDossierDto } from './dto/update-patient-dossier.dto';
import { RegisterPatientProfileDto } from './dto/register-patient-profile.dto';
import {
  PlatformAuditAction,
  Prisma,
  UserRole,
  AppointmentStatus,
  ConsultationStatus,
  PatientInAppNotificationKind,
} from '@prisma/client';
import { assertAdminNoClinicalData } from '@/common/security/admin-clinical';
import { AuditLogService } from '@/common/audit/audit-log.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import {
  medicalRecordClient,
  patientMedicalAuditClient,
  patientMedicalAuditTx,
  type ClinicalRecordRow,
  type DossierAuditRow,
} from '@/prisma/medical-dossier.client';
import { PatientNationalIdCryptoService } from '@/common/crypto/patient-national-id-crypto.service';
import { resolveStaffDoctorSpaceId } from '@/common/tenant/doctor-space-scope';

const patientInclude = {
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
} satisfies Prisma.PatientInclude;

type PatientWithUser = Prisma.PatientGetPayload<{ include: typeof patientInclude }>;

type PatientDoctorAccessListRow = Prisma.PatientDoctorAccessGetPayload<{
  include: { patient: { include: typeof patientInclude } };
}>;

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nationalIdCrypto: PatientNationalIdCryptoService,
    private readonly auditLog: AuditLogService,
  ) {}

  private dtoToPatientUpdateData(
    dto: UpdatePatientMeDto | RegisterPatientProfileDto,
    opts?: { skipNationalId?: boolean },
  ): Prisma.PatientUpdateInput {
    const data = {} as Record<string, unknown>;

    if (dto.dateOfBirth !== undefined) {
      data.dateOfBirth = dto.dateOfBirth
        ? new Date(`${dto.dateOfBirth}T12:00:00.000Z`)
        : null;
    }
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (!opts?.skipNationalId && dto.nationalId !== undefined) {
      const raw = dto.nationalId?.trim();
      if (!raw) {
        data.nationalId = null;
      } else if (this.nationalIdCrypto.isEncrypted(raw)) {
        data.nationalId = raw;
      } else {
        data.nationalId = this.nationalIdCrypto.encrypt(raw);
      }
    }
    if (dto.medicalData !== undefined) {
      data.medicalData =
        dto.medicalData === null
          ? Prisma.JsonNull
          : (dto.medicalData as Prisma.InputJsonValue);
    }
    if (dto.insuranceProvider !== undefined) data.insuranceProvider = dto.insuranceProvider;
    if (dto.insuranceNumber !== undefined) data.insuranceNumber = dto.insuranceNumber;
    if (dto.cnssAffiliation !== undefined) data.cnssAffiliation = dto.cnssAffiliation;
    if (dto.amoRightsNumber !== undefined) data.amoRightsNumber = dto.amoRightsNumber;
    if (dto.mutuelleName !== undefined) data.mutuelleName = dto.mutuelleName;
    if (dto.mutuelleContractNumber !== undefined) {
      data.mutuelleContractNumber = dto.mutuelleContractNumber;
    }
    if (dto.coverageNotes !== undefined) data.coverageNotes = dto.coverageNotes;
    if (dto.insuranceCoverage !== undefined) data.insuranceCoverage = dto.insuranceCoverage;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.bloodType !== undefined) data.bloodType = dto.bloodType;
    if (dto.allergies !== undefined) data.allergies = dto.allergies;
    if (dto.antecedents !== undefined) data.antecedents = dto.antecedents;
    if (dto.emergencyContact !== undefined) {
      data.emergencyContact =
        dto.emergencyContact === null
          ? Prisma.JsonNull
          : (dto.emergencyContact as unknown as Prisma.InputJsonValue);
    }

    if (dto.diagnoses !== undefined) {
      const stamped = dto.diagnoses.map((d) => ({
        code: d.code,
        label: d.label,
        notes: d.notes,
        recordedAt: d.recordedAt ?? new Date().toISOString(),
      }));
      data.diagnoses = stamped as Prisma.InputJsonValue;
    }

    if (dto.familyMembers !== undefined) {
      data.familyMembers =
        dto.familyMembers === null
          ? Prisma.JsonNull
          : (dto.familyMembers as unknown as Prisma.InputJsonValue);
    }

    return data as Prisma.PatientUpdateInput;
  }

  async mergeRegisterProfile(patientId: string, dto: RegisterPatientProfileDto) {
    const data = this.dtoToPatientUpdateData(dto);
    if (Object.keys(data).length === 0) return;
    await this.prisma.patient.update({
      where: { id: patientId },
      data,
    });
  }

  async ensurePatientForUser(userId: string) {
    let patient = await this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!patient) {
      patient = await this.prisma.patient.create({
        data: { userId },
      });
    }
    return patient;
  }

  async getMe(userId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
      include: patientInclude,
    });
    if (!patient || !patient.user) {
      throw new NotFoundException('Patient profile not found');
    }
    return this.serializePatient(patient, 'reveal');
  }

  async updateMe(userId: string, dto: UpdatePatientMeDto) {
    const patient = await this.ensurePatientForUser(userId);
    const data = this.dtoToPatientUpdateData(dto);
    if (dto.phone !== undefined && patient.userId) {
      await this.prisma.user.update({
        where: { id: patient.userId },
        data: { phoneNumber: dto.phone?.trim() || null },
      });
    }
    if (Object.keys(data).length === 0) {
      const row = await this.prisma.patient.findFirst({
        where: { id: patient.id, deletedAt: null },
        include: patientInclude,
      });
      if (!row?.user) throw new NotFoundException('Patient profile not found');
      return this.serializePatient(row, 'reveal');
    }
    const updated = await this.prisma.patient.update({
      where: { id: patient.id },
      data,
      include: patientInclude,
    });
    return this.serializePatient(updated, 'reveal');
  }

  async findPatientIdForUser(userId: string): Promise<string> {
    const p = await this.ensurePatientForUser(userId);
    return p.id;
  }

  /** Utilisateurs du cabinet (médecin, secrétaires, stagiaires) pour filtrer les audits dossier. */
  private async editorUserIdsForDoctorSpace(spaceId: string): Promise<string[]> {
    const space = await this.prisma.doctorSpace.findUnique({
      where: { id: spaceId },
      select: {
        doctor: { select: { userId: true } },
        secretaryLinks: { select: { userId: true } },
        traineeLinks: { select: { userId: true } },
      },
    });
    if (!space) return [];
    const ids = new Set<string>();
    if (space.doctor?.userId) ids.add(space.doctor.userId);
    for (const s of space.secretaryLinks) ids.add(s.userId);
    for (const t of space.traineeLinks) ids.add(t.userId);
    return [...ids];
  }

  /** Vérifie qu’une note clinique appartient au cabinet du demandeur (staff). */
  async assertMedicalRecordInStaffSpace(requester: RequestUser, record: { doctorSpaceId: string | null }) {
    const spaceId = resolveStaffDoctorSpaceId(requester);
    if (!spaceId) return;
    if (!record.doctorSpaceId || record.doctorSpaceId !== spaceId) {
      throw new ForbiddenException('Entrée clinique hors de votre espace cabinet');
    }
  }

  async assertCanAccessPatient(requester: RequestUser, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { id: true, userId: true },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    assertAdminNoClinicalData(requester.role);

    if (requester.role === UserRole.patient && patient.userId === requester.id) {
      return;
    }

    if (
      requester.role === UserRole.doctor ||
      requester.role === UserRole.secretary ||
      requester.role === UserRole.trainee
    ) {
      const spaceId = requester.doctorSpaceId ?? undefined;
      if (!spaceId) {
        throw new ForbiddenException('Aucun espace cabinet lié à ce compte');
      }
      const access = await this.prisma.patientDoctorAccess.findUnique({
        where: {
          patientId_doctorSpaceId: { patientId, doctorSpaceId: spaceId },
        },
      });
      if (access) return;
      throw new ForbiddenException('Patient non suivi dans cet espace cabinet');
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async listForAdmin(skip = 0, take = 20) {
    const where = { deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: patientInclude,
      }),
      this.prisma.patient.count({ where }),
    ]);
    return {
      items: rows.map((p) => this.serializePatient(p, 'reveal')),
      total,
      skip,
      take,
    };
  }

  async findByIdForStaff(requester: RequestUser, patientId: string) {
    await this.assertCanAccessPatient(requester, patientId);
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      include: patientInclude,
    });
    if (!patient?.user) throw new NotFoundException('Patient not found');
    const mode =
      requester.role === UserRole.secretary || requester.role === UserRole.trainee
        ? 'mask'
        : 'reveal';
    return this.serializePatient(patient, mode);
  }

  async updateByAdmin(patientId: string, dto: UpdatePatientMeDto) {
    const existing = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Patient not found');
    const data = this.dtoToPatientUpdateData(dto);
    if (Object.keys(data).length === 0) {
      const row = await this.prisma.patient.findFirst({
        where: { id: patientId, deletedAt: null },
        include: patientInclude,
      });
      if (!row?.user) throw new NotFoundException('Patient not found');
      return this.serializePatient(row, 'reveal');
    }
    const updated = await this.prisma.patient.update({
      where: { id: patientId },
      data,
      include: patientInclude,
    });
    return this.serializePatient(updated, 'reveal');
  }

  async softDeleteByAdmin(patientId: string) {
    const existing = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Patient not found');
    await this.prisma.patient.update({
      where: { id: patientId },
      data: { deletedAt: new Date() },
    });
    return { id: patientId, deleted: true };
  }

  async getMedicalTimelineForPatient(requester: RequestUser, patientId: string) {
    assertAdminNoClinicalData(requester.role);
    await this.assertCanAccessPatient(requester, patientId);
    if (
      requester.role === UserRole.doctor ||
      requester.role === UserRole.secretary ||
      requester.role === UserRole.trainee
    ) {
      await this.auditLog.log({
        userId: requester.id,
        doctorSpaceId: requester.doctorSpaceId ?? null,
        action: PlatformAuditAction.VIEW_PATIENT,
        entityId: patientId,
      });
    }

    const patient = (await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { diagnoses: true } as unknown as Prisma.PatientSelect,
    })) as { diagnoses: unknown } | null;
    if (!patient) throw new NotFoundException('Patient not found');

    const spaceId = resolveStaffDoctorSpaceId(requester);

    const appointmentWhere: Prisma.AppointmentWhereInput = {
      patientId,
      deletedAt: null,
      status: { not: 'cancelled' },
    };
    if (spaceId) {
      appointmentWhere.doctorSpaceId = spaceId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: appointmentWhere,
      orderBy: { startTime: 'desc' },
      take: 100,
      include: {
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
            specialty: { select: { code: true, name: true } },
          },
        },
        consultations: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { id: true },
        },
      },
    });

    const declaredDiagnoses = (patient.diagnoses as unknown[]) ?? [];

    const appointmentSummaries = appointments.map((a) => {
      const u = a.doctor.user!;
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
      const latestConsultation = a.consultations?.[0];
      return {
        id: a.id,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
        status: a.status,
        type: a.type,
        reason: a.reason ?? undefined,
        notes: a.notes ?? undefined,
        consultationId: latestConsultation?.id,
        doctor: {
          id: a.doctor.id,
          displayName: name,
          specialty: a.doctor.specialty.name,
          city: a.doctor.city,
        },
      };
    });

    const clinicalWhere: Prisma.MedicalRecordWhereInput = {
      patientId,
      deletedAt: null,
    };
    if (spaceId) {
      clinicalWhere.doctorSpaceId = spaceId;
    }

    const clinicalRecords = await medicalRecordClient(this.prisma).findMany({
      where: clinicalWhere,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        appointment: { select: { id: true, startTime: true } },
        _count: { select: { versions: true } },
      },
    });

    let dossierAudits: DossierAuditRow[];
    if (spaceId) {
      const editorIds = await this.editorUserIdsForDoctorSpace(spaceId);
      dossierAudits =
        editorIds.length > 0
          ? await patientMedicalAuditClient(this.prisma).findMany({
              where: { patientId, editorUserId: { in: editorIds } },
              orderBy: { createdAt: 'desc' },
              take: 25,
              include: {
                editor: { select: { firstName: true, lastName: true, email: true } },
              },
            })
          : [];
    } else {
      dossierAudits = await patientMedicalAuditClient(this.prisma).findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          editor: { select: { firstName: true, lastName: true, email: true } },
        },
      });
    }

    const clinicalRecordSummaries = clinicalRecords.map((r: ClinicalRecordRow) => {
      const u = r.author ?? { email: '' };
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
      return {
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        specialtyCode: r.specialtyCode,
        title: r.title ?? undefined,
        narrative: r.narrative ?? undefined,
        structuredData: r.structuredData,
        appointmentId: r.appointmentId ?? undefined,
        appointmentStart: r.appointment?.startTime?.toISOString(),
        author: { displayName: name, email: u.email },
        versionCount: r._count?.versions ?? 0,
      };
    });

    const dossierAuditSummaries = dossierAudits.map((a) => {
      const u = a.editor;
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
      return {
        id: a.id,
        createdAt: a.createdAt.toISOString(),
        summary: a.summary ?? undefined,
        editor: { displayName: name, email: u.email },
      };
    });

    return {
      patientId,
      declaredDiagnoses,
      appointmentSummaries,
      clinicalRecords: clinicalRecordSummaries,
      dossierAudits: dossierAuditSummaries,
      scopedToDoctorSpaceId: spaceId ?? undefined,
    };
  }

  private mergePatientMedicalDataJson(
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

  private mergeDiagnosesForDossier(existing: unknown, incoming: NonNullable<UpdatePatientDossierDto['diagnoses']>) {
    const cur = Array.isArray(existing) ? [...(existing as Record<string, unknown>[])] : [];
    const codes = new Set(cur.map((x) => String(x.code)));
    for (const d of incoming) {
      if (codes.has(d.code)) continue;
      cur.push({
        code: d.code,
        label: d.label,
        notes: d.notes,
        recordedAt: d.recordedAt ?? new Date().toISOString(),
      });
      codes.add(d.code);
    }
    return cur as Prisma.InputJsonValue;
  }

  async updateDossierByDoctor(requester: RequestUser, patientId: string, dto: UpdatePatientDossierDto) {
    if (requester.role === UserRole.secretary) {
      throw new ForbiddenException('Les secrétaires ne peuvent pas modifier le dossier médical');
    }
    assertAdminNoClinicalData(requester.role);
    if (requester.role !== UserRole.doctor) {
      throw new ForbiddenException('Action réservée au médecin');
    }
    await this.assertCanAccessPatient(requester, patientId);

    const hasMedical = dto.medicalData && Object.keys(dto.medicalData).length > 0;
    const hasDx = dto.diagnoses && dto.diagnoses.length > 0;
    if (!hasMedical && !hasDx) {
      throw new BadRequestException('medicalData ou diagnoses requis');
    }

    const patient = (await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: { medicalData: true, diagnoses: true } as unknown as Prisma.PatientSelect,
    })) as {
      medicalData: unknown;
      diagnoses: unknown;
    } | null;
    if (!patient) throw new NotFoundException('Patient introuvable');

    const previousPayload = {
      medicalData: patient.medicalData ?? null,
      diagnoses: patient.diagnoses ?? null,
    };

    const data = {
      ...(hasMedical && dto.medicalData
        ? { medicalData: this.mergePatientMedicalDataJson(patient.medicalData, dto.medicalData) }
        : {}),
      ...(hasDx && dto.diagnoses
        ? { diagnoses: this.mergeDiagnosesForDossier(patient.diagnoses, dto.diagnoses) }
        : {}),
    } as Prisma.PatientUpdateInput;

    await this.prisma.$transaction(async (tx) => {
      await tx.patient.update({
        where: { id: patientId },
        data,
      });
      const next = (await tx.patient.findFirst({
        where: { id: patientId },
        select: { medicalData: true, diagnoses: true } as unknown as Prisma.PatientSelect,
      })) as { medicalData: unknown; diagnoses: unknown } | null;
      await patientMedicalAuditTx(tx).create({
        data: {
          patientId,
          editorUserId: requester.id,
          previousPayload: previousPayload as Prisma.InputJsonValue,
          newPayload: {
            medicalData: next?.medicalData ?? null,
            diagnoses: next?.diagnoses ?? null,
          } as Prisma.InputJsonValue,
          summary: dto.summary ?? 'Mise à jour dossier (médecin)',
        },
      });
    });

    return this.findByIdForStaff(requester, patientId);
  }

  async syncPatientDoctorAccessFromAppointment(params: {
    patientId: string;
    doctorId: string;
    startTime: Date;
    status: AppointmentStatus;
  }): Promise<void> {
    if (
      params.status !== AppointmentStatus.confirmed &&
      params.status !== AppointmentStatus.completed
    ) {
      return;
    }
    const space = await this.prisma.doctorSpace.findUnique({
      where: { doctorId: params.doctorId },
      select: { id: true },
    });
    if (!space) return;

    const existing = await this.prisma.patientDoctorAccess.findUnique({
      where: {
        patientId_doctorSpaceId: {
          patientId: params.patientId,
          doctorSpaceId: space.id,
        },
      },
    });

    if (!existing) {
      await this.prisma.patientDoctorAccess.create({
        data: {
          patientId: params.patientId,
          doctorSpaceId: space.id,
          firstVisit: params.startTime,
          lastVisit: params.startTime,
        },
      });
      return;
    }

    const firstVisit =
      existing.firstVisit.getTime() <= params.startTime.getTime()
        ? existing.firstVisit
        : params.startTime;
    const lastVisit =
      existing.lastVisit.getTime() >= params.startTime.getTime()
        ? existing.lastVisit
        : params.startTime;
    if (
      firstVisit.getTime() === existing.firstVisit.getTime() &&
      lastVisit.getTime() === existing.lastVisit.getTime()
    ) {
      return;
    }
    await this.prisma.patientDoctorAccess.update({
      where: { id: existing.id },
      data: { firstVisit, lastVisit },
    });
  }

  async listForDoctorSpace(requester: RequestUser, opts: { q?: string; skip?: number; take?: number }) {
    assertAdminNoClinicalData(requester.role);
    if (
      requester.role !== UserRole.doctor &&
      requester.role !== UserRole.secretary &&
      requester.role !== UserRole.trainee
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    const spaceId = requester.doctorSpaceId;
    if (!spaceId) {
      return { items: [], total: 0, skip: opts.skip ?? 0, take: opts.take ?? 20 };
    }
    const skip = Math.max(0, opts.skip ?? 0);
    const take = Math.min(Math.max(1, opts.take ?? 20), 100);
    const qt = (opts.q ?? '').trim();

    const patientUserFilter =
      qt.length > 0
        ? {
            user: {
              OR: [
                { firstName: { contains: qt, mode: 'insensitive' as const } },
                { lastName: { contains: qt, mode: 'insensitive' as const } },
                { email: { contains: qt, mode: 'insensitive' as const } },
              ],
            },
          }
        : {};

    const where: Prisma.PatientDoctorAccessWhereInput = {
      doctorSpaceId: spaceId,
      patient: { deletedAt: null, ...patientUserFilter },
    };

    const [total, rows] = (await this.prisma.$transaction([
      this.prisma.patientDoctorAccess.count({ where }),
      this.prisma.patientDoctorAccess.findMany({
        where,
        orderBy: { lastVisit: 'desc' },
        skip,
        take,
        include: {
          patient: { include: patientInclude },
        },
      }),
    ])) as [number, PatientDoctorAccessListRow[]];

    const mode =
      requester.role === UserRole.secretary || requester.role === UserRole.trainee
        ? 'mask'
        : 'reveal';
    const items = rows
      .filter((r) => r.patient?.user)
      .map((r) => ({
        ...this.serializePatient(r.patient!, mode),
        spaceFirstVisit: r.firstVisit.toISOString(),
        spaceLastVisit: r.lastVisit.toISOString(),
      }));

    return { items, total, skip, take };
  }

  async updatePatientByStaff(requester: RequestUser, patientId: string, dto: UpdatePatientMeDto) {
    assertAdminNoClinicalData(requester.role);
    if (
      requester.role !== UserRole.doctor &&
      requester.role !== UserRole.secretary
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    if (requester.role === UserRole.secretary) {
      if (dto.diagnoses !== undefined || dto.nationalId !== undefined || dto.medicalData !== undefined) {
        throw new ForbiddenException('Données médicales : réservé au médecin');
      }
    }
    await this.assertCanAccessPatient(requester, patientId);
    const data = this.dtoToPatientUpdateData(dto, {
      skipNationalId: requester.role === UserRole.secretary,
    });
    if (dto.phone !== undefined) {
      const p = await this.prisma.patient.findFirst({
        where: { id: patientId },
        select: { userId: true },
      });
      if (p?.userId) {
        await this.prisma.user.update({
          where: { id: p.userId },
          data: { phoneNumber: dto.phone?.trim() || null },
        });
      }
    }
    if (Object.keys(data).length === 0) {
      return this.findByIdForStaff(requester, patientId);
    }
    const updated = await this.prisma.patient.update({
      where: { id: patientId },
      data,
      include: patientInclude,
    });
    return this.findByIdForStaff(requester, updated.id);
  }

  async softDeleteForStaff(requester: RequestUser, patientId: string) {
    assertAdminNoClinicalData(requester.role);
    if (requester.role !== UserRole.doctor) {
      throw new ForbiddenException('Archivage réservé au médecin');
    }
    await this.assertCanAccessPatient(requester, patientId);
    return this.softDeleteByAdmin(patientId);
  }

  async recordConsent(userId: string, type: string, signedAt: string) {
    const patient = await this.ensurePatientForUser(userId);
    const when = new Date(signedAt);
    if (Number.isNaN(when.getTime())) {
      throw new BadRequestException('signedAt invalide');
    }
    const t = type.trim();
    await this.prisma.patientConsent.upsert({
      where: {
        patientId_type: { patientId: patient.id, type: t },
      },
      create: {
        patientId: patient.id,
        type: t,
        signedAt: when,
      },
      update: { signedAt: when },
    });
    return { patientId: patient.id, type: t, signedAt: when.toISOString() };
  }

  async addDiagnosisForDoctor(
    requester: RequestUser,
    patientId: string,
    dto: { code: string; label: string; notes?: string },
  ) {
    assertAdminNoClinicalData(requester.role);
    if (requester.role !== UserRole.doctor) {
      throw new ForbiddenException('Réservé au médecin');
    }
    await this.assertCanAccessPatient(requester, patientId);
    return this.updateDossierByDoctor(requester, patientId, {
      diagnoses: [{ code: dto.code, label: dto.label, notes: dto.notes }],
      summary: `Diagnostic CIM-10 ajouté : ${dto.code}`,
    });
  }

  async searchLightForStaff(user: RequestUser, q: string, take = 20) {
    assertAdminNoClinicalData(user.role);
    if (
      user.role !== UserRole.doctor &&
      user.role !== UserRole.secretary &&
      user.role !== UserRole.trainee
    ) {
      throw new ForbiddenException('Accès refusé');
    }
    const qt = (q ?? '').trim();
    if (qt.length < 2) return [];

    if (
      user.role === UserRole.doctor ||
      user.role === UserRole.secretary ||
      user.role === UserRole.trainee
    ) {
      const sid = user.doctorSpaceId;
      if (!sid) return [];
      const rows = await this.prisma.patientDoctorAccess.findMany({
        where: {
          doctorSpaceId: sid,
          patient: {
            deletedAt: null,
            user: {
              OR: [
                { firstName: { contains: qt, mode: 'insensitive' } },
                { lastName: { contains: qt, mode: 'insensitive' } },
                { email: { contains: qt, mode: 'insensitive' } },
              ],
            },
          },
        },
        take: Math.min(Math.max(take, 1), 50),
        orderBy: { lastVisit: 'desc' },
        include: { patient: { include: patientInclude } },
      });
      return rows
        .filter((r: { patient: { user: any; }; }) => r.patient?.user)
        .map((r: { patient: any; }) => ({
          id: r.patient!.id,
          email: r.patient!.user?.email,
          firstName: r.patient!.user?.firstName,
          lastName: r.patient!.user?.lastName,
        }));
    }

    const rows = await this.prisma.patient.findMany({
      where: {
        deletedAt: null,
        user: {
          OR: [
            { firstName: { contains: qt, mode: 'insensitive' } },
            { lastName: { contains: qt, mode: 'insensitive' } },
            { email: { contains: qt, mode: 'insensitive' } },
          ],
        },
      },
      take: Math.min(Math.max(take, 1), 50),
      orderBy: { createdAt: 'desc' },
      include: patientInclude,
    });
    return rows.map((p) => ({
      id: p.id,
      email: p.user?.email,
      firstName: p.user?.firstName,
      lastName: p.user?.lastName,
    }));
  }

  private formatNationalIdResponse(
    stored: string | null | undefined,
    mode: 'reveal' | 'mask',
  ): string | undefined {
    if (!stored?.trim()) return undefined;
    try {
      const plain = this.nationalIdCrypto.isEncrypted(stored)
        ? this.nationalIdCrypto.decrypt(stored)
        : stored;
      return mode === 'reveal' ? plain : this.nationalIdCrypto.maskForDisplay(plain);
    } catch {
      return undefined;
    }
  }

  private serializePatient(patient: PatientWithUser, nationalIdMode: 'reveal' | 'mask' = 'reveal') {
    const p = patient as PatientWithUser & {
      cnssAffiliation?: string | null;
      amoRightsNumber?: string | null;
      mutuelleName?: string | null;
      mutuelleContractNumber?: string | null;
      coverageNotes?: string | null;
      diagnoses?: unknown;
      insuranceCoverage?: string | null;
      address?: string | null;
      phone?: string | null;
      allergies?: string[];
      antecedents?: string[];
      bloodType?: string | null;
      emergencyContact?: unknown;
    };
    const u = p.user;
    if (!u) {
      throw new NotFoundException('Patient user missing');
    }
    const medicalData =
      patient.medicalData && typeof patient.medicalData === 'object' && !Array.isArray(patient.medicalData)
        ? ({ ...(patient.medicalData as Record<string, unknown>) } as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    if (p.allergies?.length) medicalData.allergies = p.allergies;
    if (p.antecedents?.length) medicalData.chronicDiseases = p.antecedents;
    if (p.bloodType) medicalData.bloodGroup = p.bloodType;

    return {
      id: patient.id,
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString(),
      dateOfBirth: patient.dateOfBirth
        ? patient.dateOfBirth.toISOString().slice(0, 10)
        : undefined,
      gender: patient.gender ?? undefined,
      nationalId: this.formatNationalIdResponse(patient.nationalId ?? null, nationalIdMode),
      medicalData: Object.keys(medicalData).length ? medicalData : undefined,
      insuranceProvider: patient.insuranceProvider ?? undefined,
      insuranceNumber: patient.insuranceNumber ?? undefined,
      insuranceCoverage: p.insuranceCoverage ?? undefined,
      cnssAffiliation: p.cnssAffiliation ?? undefined,
      amoRightsNumber: p.amoRightsNumber ?? undefined,
      mutuelleName: p.mutuelleName ?? undefined,
      mutuelleContractNumber: p.mutuelleContractNumber ?? undefined,
      coverageNotes: p.coverageNotes ?? undefined,
      diagnoses: p.diagnoses ?? undefined,
      familyMembers: patient.familyMembers ?? undefined,
      address: p.address ?? undefined,
      phone: p.phone ?? undefined,
      allergies: p.allergies?.length ? p.allergies : undefined,
      antecedents: p.antecedents?.length ? p.antecedents : undefined,
      bloodType: p.bloodType ?? undefined,
      emergencyContact: p.emergencyContact ?? undefined,
      user: {
        id: u.id,
        email: u.email,
        firstName: u.firstName ?? undefined,
        lastName: u.lastName ?? undefined,
        role: u.role,
        phoneNumber: u.phoneNumber ?? undefined,
        isActive: u.isActive,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      },
    };
  }

  async pushInAppNotification(
    patientId: string,
    input: {
      kind: PatientInAppNotificationKind;
      title: string;
      body?: string | null;
      linkPath?: string | null;
      meta?: Prisma.InputJsonValue;
    },
  ): Promise<void> {
    await this.prisma.patientInAppNotification.create({
      data: {
        patientId,
        kind: input.kind,
        title: input.title,
        body: input.body ?? null,
        linkPath: input.linkPath ?? null,
        meta: input.meta === undefined ? undefined : input.meta,
      },
    });
  }

  async listMyInAppNotifications(userId: string) {
    const pid = await this.findPatientIdForUser(userId);
    const [items, unreadCount] = await Promise.all([
      this.prisma.patientInAppNotification.findMany({
        where: { patientId: pid },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.patientInAppNotification.count({
        where: { patientId: pid, readAt: null },
      }),
    ]);
    return {
      unreadCount,
      items: items.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        readAt: r.readAt?.toISOString() ?? null,
        kind: r.kind,
        title: r.title,
        body: r.body ?? undefined,
        linkPath: r.linkPath ?? undefined,
        meta: r.meta,
      })),
    };
  }

  async markMyNotificationRead(userId: string, notificationId: string) {
    const pid = await this.findPatientIdForUser(userId);
    const row = await this.prisma.patientInAppNotification.findFirst({
      where: { id: notificationId, patientId: pid },
    });
    if (!row) throw new NotFoundException('Notification introuvable');
    if (!row.readAt) {
      await this.prisma.patientInAppNotification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });
    }
    return { id: notificationId, read: true };
  }

  async markAllMyNotificationsRead(userId: string) {
    const pid = await this.findPatientIdForUser(userId);
    const now = new Date();
    await this.prisma.patientInAppNotification.updateMany({
      where: { patientId: pid, readAt: null },
      data: { readAt: now },
    });
    return { updated: true };
  }

  async listMyReceiptsForUser(userId: string) {
    const pid = await this.findPatientIdForUser(userId);
    const rows = await this.prisma.consultation.findMany({
      where: {
        patientId: pid,
        status: ConsultationStatus.completed,
        receipt: { isNot: null },
      },
      orderBy: [{ closedAt: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
      include: {
        receipt: true,
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
    return rows.map((r) => {
      const u = r.doctor.user!;
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email;
      const rc = r.receipt!;
      return {
        receiptId: rc.id,
        consultationId: r.id,
        amount: Number(rc.amount),
        currency: rc.currency,
        createdAt: rc.createdAt.toISOString(),
        closedAt: r.closedAt?.toISOString() ?? null,
        specialtyCode: r.specialtyCode,
        doctorDisplayName: name,
      };
    });
  }

  private collectDocumentItemsFromStructuredData(
    structuredData: unknown,
    base: {
      sourceType: 'consultation' | 'medical_record';
      sourceId: string;
      defaultAt: string;
      specialtyCode?: string;
    },
    out: Array<
      | {
          id: string;
          title: string;
          url: string;
          kind: string;
          sourceType: 'consultation' | 'medical_record';
          sourceId: string;
          specialtyCode?: string;
          createdAt: string;
        }
      | {
          id: string;
          title: string;
          kind: string;
          sourceType: 'prescription_ref';
          sourceId: string;
          specialtyCode?: string;
          createdAt: string;
          ref: string;
        }
    >,
  ) {
    if (!structuredData || typeof structuredData !== 'object' || Array.isArray(structuredData)) return;
    const sd = structuredData as Record<string, unknown>;
    const raw = sd.patientDocuments ?? sd.attachments;
    if (!Array.isArray(raw)) return;
    let i = 0;
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const o = entry as Record<string, unknown>;
      const url =
        typeof o.url === 'string'
          ? o.url
          : typeof o.href === 'string'
            ? o.href
            : typeof o.fileUrl === 'string'
              ? o.fileUrl
              : null;
      if (!url) continue;
      const title =
        typeof o.title === 'string'
          ? o.title
          : typeof o.label === 'string'
            ? o.label
            : typeof o.name === 'string'
              ? o.name
              : 'Document';
      const kind = typeof o.kind === 'string' ? o.kind : typeof o.mime === 'string' ? o.mime : 'file';
      const createdAt =
        typeof o.createdAt === 'string' ? o.createdAt : typeof o.uploadedAt === 'string' ? o.uploadedAt : base.defaultAt;
      const idSuffix = typeof o.id === 'string' ? o.id : `${i++}`;
      out.push({
        id: `${base.sourceType}-${base.sourceId}-${idSuffix}`,
        title,
        url,
        kind,
        sourceType: base.sourceType,
        sourceId: base.sourceId,
        specialtyCode: base.specialtyCode,
        createdAt,
      });
    }
  }

  async listMyDocumentItemsForUser(userId: string) {
    const pid = await this.findPatientIdForUser(userId);
    const consultations = await this.prisma.consultation.findMany({
      where: {
        patientId: pid,
        status: { in: [ConsultationStatus.completed, ConsultationStatus.in_progress] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        specialtyCode: true,
        structuredData: true,
        prescriptionIds: true,
      },
    });
    const records = await this.prisma.medicalRecord.findMany({
      where: { patientId: pid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        specialtyCode: true,
        structuredData: true,
        title: true,
      },
    });

    const items: (
      | {
          id: string;
          title: string;
          url: string;
          kind: string;
          sourceType: 'consultation' | 'medical_record';
          sourceId: string;
          specialtyCode?: string;
          createdAt: string;
        }
      | {
          id: string;
          title: string;
          kind: string;
          sourceType: 'prescription_ref';
          sourceId: string;
          specialtyCode?: string;
          createdAt: string;
          ref: string;
        }
    )[] = [];

    for (const c of consultations) {
      const at = (c.closedAt ?? c.updatedAt ?? c.createdAt).toISOString();
      this.collectDocumentItemsFromStructuredData(c.structuredData, {
        sourceType: 'consultation',
        sourceId: c.id,
        defaultAt: at,
        specialtyCode: c.specialtyCode,
      }, items);
      for (const ref of c.prescriptionIds) {
        if (!ref?.trim()) continue;
        items.push({
          id: `prescription_ref-${c.id}-${ref}`,
          title: `Ordonnance (réf. ${ref})`,
          kind: 'prescription_ref',
          sourceType: 'prescription_ref',
          sourceId: c.id,
          specialtyCode: c.specialtyCode,
          createdAt: at,
          ref: ref.trim(),
        });
      }
    }

    for (const r of records) {
      this.collectDocumentItemsFromStructuredData(r.structuredData, {
        sourceType: 'medical_record',
        sourceId: r.id,
        defaultAt: r.createdAt.toISOString(),
        specialtyCode: r.specialtyCode,
      }, items);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { items };
  }
}
