import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PatientsService } from '@/modules/patients/patients.service';
import { resolveStaffDoctorSpaceId } from '@/common/tenant/doctor-space-scope';
import type { SanitizedUser } from '@/modules/users/users.service';
import type { RequestUser } from '@/modules/auth/auth.types';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';
import { UpdateClinicalRecordDto } from './dto/update-clinical-record.dto';
import { ImportDossierDto } from './dto/import-dossier.dto';
import {
  GENERIC_SPECIALTY_TEMPLATE,
  OPHTHALMOLOGY_FIELD_TEMPLATE,
} from './ophthalmology-template';
import {
  clinicalTransaction,
  medicalRecordVersionClient,
  medicalRecordWriteClient,
  type ClinicalRecordRow,
  type MedicalRecordVersionRow,
} from '@/prisma/medical-dossier.client';

@Injectable()
export class MedicalRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
  ) {}

  private async doctorIdForUser(userId: string): Promise<string | null> {
    const d = await this.prisma.doctor.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    return d?.id ?? null;
  }

  private async doctorSpecialtyCode(userId: string): Promise<string> {
    const d = await this.prisma.doctor.findFirst({
      where: { userId, deletedAt: null },
      select: { specialtyCode: true },
    });
    return d?.specialtyCode ?? 'general-medicine';
  }

  private assertDoctorOrAdmin(user: SanitizedUser) {
    if (user.role === UserRole.admin || user.role === UserRole.super_admin) {
      throw new ForbiddenException('Les administrateurs n’ont pas accès aux dossiers médicaux.');
    }
    if (user.role !== UserRole.doctor) {
      throw new ForbiddenException('Action réservée au médecin');
    }
  }

  private mergeJsonObjects(
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

  private mergeDiagnosesList(existing: unknown, incoming: ImportDossierDto['diagnoses']) {
    if (!incoming?.length) return undefined;
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

  async getFieldTemplate(specialtyCode: string) {
    const row = await this.prisma.specialty.findFirst({
      where: { code: specialtyCode, deletedAt: null },
      select: { code: true, name: true, defaultFields: true, specificFields: true },
    });
    const fromDb = (row?.defaultFields as Record<string, unknown> | null) ?? null;
    const fromSpecific = row?.specificFields;
    const base =
      specialtyCode === 'ophthalmology'
        ? OPHTHALMOLOGY_FIELD_TEMPLATE
        : GENERIC_SPECIALTY_TEMPLATE;
    return {
      specialtyCode: row?.code ?? specialtyCode,
      specialtyName: row?.name,
      template: base,
      specialtyOverrides: fromDb,
      specificFields: fromSpecific,
    };
  }

  async listForPatient(requester: SanitizedUser, patientId: string) {
    await this.patientsService.assertCanAccessPatient(requester, patientId);
    const spaceId = resolveStaffDoctorSpaceId(requester);
    const where: Prisma.MedicalRecordWhereInput = { patientId, deletedAt: null };
    if (spaceId) where.doctorSpaceId = spaceId;
    const rows = await medicalRecordWriteClient(this.prisma).findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        appointment: { select: { id: true, startTime: true } },
        _count: { select: { versions: true } },
      },
    });
    return rows.map((r) => this.serializeClinicalRecord(r));
  }

  async listAuthoredByDoctor(
    requester: SanitizedUser,
    opts: { skip: number; take: number; q?: string },
  ) {
    if (requester.role !== UserRole.doctor) {
      throw new ForbiddenException('Réservé au médecin');
    }

    const qt = (opts.q ?? '').trim();
    const baseWhere: Prisma.MedicalRecordWhereInput = {
      deletedAt: null,
      authorUserId: requester.id,
      patient: { deletedAt: null },
    };

    const where: Prisma.MedicalRecordWhereInput =
      qt.length > 0
        ? {
            ...baseWhere,
            OR: [
              { title: { contains: qt, mode: 'insensitive' } },
              { narrative: { contains: qt, mode: 'insensitive' } },
              {
                patient: {
                  user: {
                    OR: [
                      { firstName: { contains: qt, mode: 'insensitive' } },
                      { lastName: { contains: qt, mode: 'insensitive' } },
                      { email: { contains: qt, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            ],
          }
        : baseWhere;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const take = Math.min(Math.max(opts.take, 1), 100);
    const skip = Math.max(0, opts.skip);

    const rows = await medicalRecordWriteClient(this.prisma).findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        appointment: { select: { id: true, startTime: true } },
        patient: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        _count: { select: { versions: true } },
      },
    });

    const [total, monthTotal, draftCount] = await Promise.all([
      medicalRecordWriteClient(this.prisma).count({ where }),
      medicalRecordWriteClient(this.prisma).count({
        where: {
          ...baseWhere,
          createdAt: { gte: monthStart },
        },
      }),
      medicalRecordWriteClient(this.prisma).count({
        where: {
          ...baseWhere,
          versions: { none: {} },
        },
      }),
    ]);

    type RowWithPatient = ClinicalRecordRow & {
      patient: {
        id: string;
        user: { firstName?: string | null; lastName?: string | null; email: string } | null;
      };
    };

    const items = (rows as RowWithPatient[]).map((r) => {
      const base = this.serializeClinicalRecord(r);
      const u = r.patient.user;
      const name = u ? [u.firstName, u.lastName].filter(Boolean).join(' ').trim() : '';
      return {
        ...base,
        patientDisplayName: name || u?.email || 'Patient',
      };
    });

    return {
      items,
      total,
      skip,
      take,
      stats: { monthTotal, draftCount },
    };
  }

  async getOne(requester: SanitizedUser, id: string) {
    const row = (await medicalRecordWriteClient(this.prisma).findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        appointment: { select: { id: true, startTime: true } },
        _count: { select: { versions: true } },
      },
    })) as ClinicalRecordRow | null;
    if (!row) throw new NotFoundException('Entrée introuvable');
    await this.patientsService.assertCanAccessPatient(requester, row.patientId);
    await this.patientsService.assertMedicalRecordInStaffSpace(requester as RequestUser, row);
    return this.serializeClinicalRecord(row);
  }

  async listVersions(requester: SanitizedUser, id: string) {
    const row = (await medicalRecordWriteClient(this.prisma).findFirst({
      where: { id, deletedAt: null },
      select: { patientId: true, doctorSpaceId: true },
    })) as { patientId: string; doctorSpaceId: string | null } | null;
    if (!row) throw new NotFoundException('Entrée introuvable');
    await this.patientsService.assertCanAccessPatient(requester, row.patientId);
    await this.patientsService.assertMedicalRecordInStaffSpace(requester as RequestUser, row);
    const versions = await medicalRecordVersionClient(this.prisma).findMany({
      where: { medicalRecordId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        editedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return versions.map((v: MedicalRecordVersionRow) => ({
      id: v.id,
      createdAt: v.createdAt.toISOString(),
      snapshot: v.snapshot,
      changeSummary: v.changeSummary ?? undefined,
      editedBy: this.displayUser(v.editedBy),
    }));
  }

  async create(requester: SanitizedUser, dto: CreateClinicalRecordDto) {
    this.assertDoctorOrAdmin(requester);
    await this.patientsService.assertCanAccessPatient(requester, dto.patientId);

    let specialtyCode = dto.specialtyCode?.trim();
    if (!specialtyCode) {
      if (requester.role === UserRole.doctor) {
        specialtyCode = await this.doctorSpecialtyCode(requester.id);
      } else {
        specialtyCode = 'general-medicine';
      }
    }

    let doctorSpaceId: string | null = resolveStaffDoctorSpaceId(requester as RequestUser);

    if (dto.appointmentId) {
      const apt = await this.prisma.appointment.findFirst({
        where: { id: dto.appointmentId, patientId: dto.patientId, deletedAt: null },
      });
      if (!apt) throw new BadRequestException('Rendez-vous invalide pour ce patient');
      if (requester.role === UserRole.doctor) {
        const doctorId = await this.doctorIdForUser(requester.id);
        if (!doctorId || apt.doctorId !== doctorId) {
          throw new ForbiddenException('Ce rendez-vous n’est pas au bon médecin');
        }
      }
      if (apt.doctorSpaceId) {
        if (doctorSpaceId && apt.doctorSpaceId !== doctorSpaceId) {
          throw new ForbiddenException('Rendez-vous hors de votre espace cabinet');
        }
        doctorSpaceId = apt.doctorSpaceId;
      }
    }

    if (requester.role === UserRole.admin && !doctorSpaceId && dto.appointmentId) {
      const apt = await this.prisma.appointment.findFirst({
        where: { id: dto.appointmentId, deletedAt: null },
        select: { doctorSpaceId: true },
      });
      doctorSpaceId = apt?.doctorSpaceId ?? null;
    }

    if (requester.role === UserRole.doctor && !doctorSpaceId) {
      const doctorId = await this.doctorIdForUser(requester.id);
      if (doctorId) {
        const space = await this.prisma.doctorSpace.findUnique({
          where: { doctorId },
          select: { id: true },
        });
        doctorSpaceId = space?.id ?? null;
      }
    }

    const created = await medicalRecordWriteClient(this.prisma).create({
      data: {
        patientId: dto.patientId,
        authorUserId: requester.id,
        appointmentId: dto.appointmentId ?? null,
        doctorSpaceId,
        specialtyCode,
        title: dto.title ?? null,
        narrative: dto.narrative ?? null,
        structuredData: dto.structuredData as Prisma.InputJsonValue,
      },
      include: {
        author: { select: { firstName: true, lastName: true, email: true } },
        appointment: { select: { id: true, startTime: true } },
        _count: { select: { versions: true } },
      },
    });
    return this.serializeClinicalRecord(created);
  }

  async update(requester: SanitizedUser, id: string, dto: UpdateClinicalRecordDto) {
    this.assertDoctorOrAdmin(requester);
    const existing = (await medicalRecordWriteClient(this.prisma).findFirst({
      where: { id, deletedAt: null },
    })) as ClinicalRecordRow | null;
    if (!existing) throw new NotFoundException('Entrée introuvable');
    await this.patientsService.assertCanAccessPatient(requester, existing.patientId);
    await this.patientsService.assertMedicalRecordInStaffSpace(requester as RequestUser, existing);

    if (requester.role === UserRole.doctor) {
      const doctorId = await this.doctorIdForUser(requester.id);
      if (!doctorId) throw new ForbiddenException('Profil médecin introuvable');
      const linked = await this.prisma.appointment.findFirst({
        where: { doctorId, patientId: existing.patientId, deletedAt: null },
      });
      if (!linked) {
        throw new ForbiddenException('Aucune relation de soins avec ce patient');
      }
      if (existing.appointmentId) {
        const apt = await this.prisma.appointment.findFirst({
          where: { id: existing.appointmentId, deletedAt: null },
        });
        if (apt && apt.doctorId !== doctorId) {
          throw new ForbiddenException('Cette entrée est liée à un autre médecin');
        }
      }
    }

    const hasPatch =
      dto.title !== undefined ||
      dto.narrative !== undefined ||
      dto.structuredData !== undefined;
    if (!hasPatch) {
      return this.getOne(requester, id);
    }

    await this.prisma.$transaction(async (tx) => {
      const ct = clinicalTransaction(tx);
      await ct.medicalRecordVersion.create({
        data: {
          medicalRecordId: id,
          editedByUserId: requester.id,
          changeSummary: dto.changeSummary ?? null,
          snapshot: {
            title: existing.title,
            narrative: existing.narrative,
            structuredData: existing.structuredData,
          } as Prisma.InputJsonValue,
        },
      });
      await ct.medicalRecord.update({
        where: { id },
        data: {
          title: dto.title !== undefined ? dto.title : undefined,
          narrative: dto.narrative !== undefined ? dto.narrative : undefined,
          structuredData:
            dto.structuredData !== undefined
              ? (dto.structuredData as Prisma.InputJsonValue)
              : undefined,
        },
      });
    });

    return this.getOne(requester, id);
  }

  async importDossier(requester: SanitizedUser, patientId: string, dto: ImportDossierDto) {
    this.assertDoctorOrAdmin(requester);
    await this.patientsService.assertCanAccessPatient(requester, patientId);

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
      ...(dto.medicalData && Object.keys(dto.medicalData).length > 0
        ? { medicalData: this.mergeJsonObjects(patient.medicalData, dto.medicalData) }
        : {}),
      ...(dto.diagnoses?.length
        ? { diagnoses: this.mergeDiagnosesList(patient.diagnoses, dto.diagnoses) }
        : {}),
    } as Prisma.PatientUpdateInput;

    if (Object.keys(data).length === 0 && !dto.createClinicalTrace) {
      return { imported: false, message: 'Aucune donnée à fusionner' };
    }

    await this.prisma.$transaction(async (tx) => {
      const ct = clinicalTransaction(tx);
      if (Object.keys(data).length > 0) {
        await tx.patient.update({
          where: { id: patientId },
          data,
        });
      }
      const newPatient = (await tx.patient.findFirst({
        where: { id: patientId },
        select: { medicalData: true, diagnoses: true } as unknown as Prisma.PatientSelect,
      })) as { medicalData: unknown; diagnoses: unknown } | null;
      await ct.patientMedicalAudit.create({
        data: {
          patientId,
          editorUserId: requester.id,
          previousPayload: previousPayload as Prisma.InputJsonValue,
          newPayload: {
            medicalData: newPatient?.medicalData ?? null,
            diagnoses: newPatient?.diagnoses ?? null,
          } as Prisma.InputJsonValue,
          summary: dto.summary ?? 'Import / fusion dossier',
        },
      });
      if (dto.createClinicalTrace) {
        const spec =
          requester.role === UserRole.doctor
            ? await this.doctorSpecialtyCode(requester.id)
            : 'general-medicine';
        await ct.medicalRecord.create({
          data: {
            patientId,
            authorUserId: requester.id,
            specialtyCode: spec,
            title: 'Import données',
            narrative: dto.summary ?? null,
            structuredData: {
              source: 'import',
              payload: { medicalData: dto.medicalData ?? null, diagnoses: dto.diagnoses ?? null },
            } as Prisma.InputJsonValue,
          },
        });
      }
    });

    return { imported: true, patientId };
  }

  private displayUser(u: { firstName?: string | null; lastName?: string | null; email: string }) {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return { displayName: name || u.email, email: u.email };
  }

  private serializeClinicalRecord(
    r: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      patientId: string;
      specialtyCode: string;
      title: string | null;
      narrative: string | null;
      structuredData: unknown;
      appointmentId: string | null;
      author?: { firstName?: string | null; lastName?: string | null; email: string };
      appointment?: { id: string; startTime: Date } | null;
      _count?: { versions: number };
    },
  ) {
    return {
      id: r.id,
      patientId: r.patientId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      specialtyCode: r.specialtyCode,
      title: r.title ?? undefined,
      narrative: r.narrative ?? undefined,
      structuredData: r.structuredData,
      appointmentId: r.appointmentId ?? undefined,
      appointmentStart: r.appointment?.startTime?.toISOString(),
      author: this.displayUser(r.author ?? { email: '' }),
      versionCount: r._count?.versions ?? 0,
    };
  }
}
