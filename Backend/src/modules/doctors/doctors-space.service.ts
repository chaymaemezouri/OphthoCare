import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CreateDoctorSiteDto } from '@modules/doctors/dto/create-doctor-site.dto';
import { UpdateDoctorSiteDto } from '@modules/doctors/dto/update-doctor-site.dto';
import { PatchSiteWorkingHoursDto, SiteWorkingHourItemDto } from '@modules/doctors/dto/patch-site-working-hours.dto';
import { CreateTariffDto } from '@modules/doctors/dto/create-tariff.dto';
import { UpdateTariffDto } from '@modules/doctors/dto/update-tariff.dto';
import { jsonWorkingHoursToSiteRows, siteRowsToJsonWorkingHours } from './doctors-space-hours.util';
import { bootstrapDoctorSpace } from './doctors-space.bootstrap';

export { jsonWorkingHoursToSiteRows, siteRowsToJsonWorkingHours } from './doctors-space-hours.util';

/** Shape minimal pour `serializeSite` (évite PrismaClient / modèles mal résolus par certains IDE). */
type DoctorSiteWithHoursAndTariffs = {
  id: string;
  doctorSpaceId: string;
  name: string;
  street: string;
  postalCode: string | null;
  city: string;
  country: string;
  latitude: unknown;
  longitude: unknown;
  phone: string | null;
  partnerTypes: string[];
  isPrimary: boolean;
  displayOrder: number;
  workingHours: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  tariffs: Array<{
    id: string;
    actType: string;
    label: string;
    amount: unknown;
    currency: string;
    durationMinutes: number | null;
  }>;
};

function hmToMinutes(s: string): number {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function mergeMinuteRanges(ranges: { start: number; end: number }[]): { start: number; end: number }[] {
  const sorted = [...ranges].filter((r) => !Number.isNaN(r.start) && !Number.isNaN(r.end) && r.end > r.start).sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (!last || r.start > last.end) merged.push({ ...r });
    else last.end = Math.max(last.end, r.end);
  }
  return merged;
}

@Injectable()
export class DoctorsSpaceService {
  private onDoctorSearchMutated?: (doctorId: string) => void;

  constructor(private readonly prisma: PrismaService) {}

  /** Délégués Prisma cabinet — cast `any` car `@prisma/client` peut être partiellement typé si `prisma generate` n’a pas abouti dans l’IDE. */
  private get db(): any {
    return this.prisma;
  }

  attachSearchReindex(handler: (doctorId: string) => void): void {
    this.onDoctorSearchMutated = handler;
  }

  private fireSearchReindex(doctorId: string): void {
    try {
      void this.onDoctorSearchMutated?.(doctorId);
    } catch {
      /* ignore */
    }
  }

  async requireDoctorIdByUser(userId: string): Promise<string> {
    const d = await this.db.doctor.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!d) throw new NotFoundException('Profil médecin introuvable');
    return d.id;
  }

  /**
   * Crée DoctorSpace + site principal + horaires (depuis JSON médecin) + tarif par défaut si absent.
   */
  async ensureBootstrapForDoctor(doctorId: string): Promise<void> {
    await bootstrapDoctorSpace(this.db, doctorId);
  }

  async getMergedWorkingMinuteRanges(
    doctorId: string,
    dayOfWeek: number,
  ): Promise<{ start: number; end: number }[]> {
    const space = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      include: {
        sites: {
          where: { deletedAt: null },
          include: {
            workingHours: {
              where: { dayOfWeek, isActive: true },
            },
          },
        },
      },
    });
    const raw: { start: number; end: number }[] = [];
    if (!space?.sites.length) return raw;
    for (const site of space.sites) {
      for (const wh of site.workingHours) {
        const start = hmToMinutes(wh.startTime);
        const end = hmToMinutes(wh.endTime);
        if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
          raw.push({ start, end });
        }
      }
    }
    return mergeMinuteRanges(raw);
  }

  /** Plages horaires fusionnées pour un site donné (un jour de la semaine). */
  async getMergedWorkingMinuteRangesForSite(
    siteId: string,
    dayOfWeek: number,
  ): Promise<{ start: number; end: number }[]> {
    const site = await this.db.doctorSite.findFirst({
      where: { id: siteId, deletedAt: null },
      include: {
        workingHours: {
          where: { dayOfWeek, isActive: true },
        },
      },
    });
    if (!site) return [];
    const raw: { start: number; end: number }[] = [];
    for (const wh of site.workingHours) {
      const start = hmToMinutes(wh.startTime);
      const end = hmToMinutes(wh.endTime);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
        raw.push({ start, end });
      }
    }
    return mergeMinuteRanges(raw);
  }

  async assertSiteBelongsToDoctor(doctorId: string, siteId: string): Promise<void> {
    await this.requireSiteOfDoctor(doctorId, siteId);
  }

  async getDoctorSpaceIdForDoctor(doctorId: string): Promise<string | null> {
    const row = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async getPrimarySiteIdForDoctor(doctorId: string): Promise<string | null> {
    const space = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      include: {
        sites: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
          take: 1,
          select: { id: true },
        },
      },
    });
    return space?.sites[0]?.id ?? null;
  }

  async syncJsonWorkingHoursToPrimarySite(doctorId: string, json: unknown): Promise<void> {
    const space = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      include: {
        sites: { where: { deletedAt: null, isPrimary: true }, take: 1 },
      },
    });
    const primary = space?.sites[0];
    if (!primary) return;
    await this.db.$transaction(async (tx: any) => {
      await tx.siteWorkingHour.deleteMany({ where: { doctorSiteId: primary.id } });
      const rows = jsonWorkingHoursToSiteRows(primary.id, json);
      if (rows.length) await tx.siteWorkingHour.createMany({ data: rows });
    });
  }

  async syncPrimarySiteLocationToDoctor(doctorId: string): Promise<void> {
    const space = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      include: {
        sites: {
          where: { deletedAt: null, isPrimary: true },
          take: 1,
        },
      },
    });
    const p = space?.sites[0];
    if (!p) return;
    await this.db.doctor.update({
      where: { id: doctorId },
      data: {
        city: p.city,
        street: p.street,
        postalCode: p.postalCode ?? '',
        latitude: p.latitude ?? undefined,
        longitude: p.longitude ?? undefined,
      },
    });
  }

  async listSites(userId: string) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    await this.ensureBootstrapForDoctor(doctorId);
    const space = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      include: {
        sites: {
          where: { deletedAt: null },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            workingHours: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
            tariffs: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    return (space?.sites ?? []).map((s: DoctorSiteWithHoursAndTariffs) => this.serializeSite(s));
  }

  /** Sites publics (fiche praticien / annuaire), sans userId. */
  async listSitesForPublicDoctor(doctorId: string) {
    const space = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      include: {
        sites: {
          where: { deletedAt: null },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          include: {
            workingHours: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
            tariffs: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    return (space?.sites ?? []).map((s: DoctorSiteWithHoursAndTariffs) => this.serializeSite(s));
  }

  private serializeSite(s: DoctorSiteWithHoursAndTariffs) {
    return {
      id: s.id,
      doctorSpaceId: s.doctorSpaceId,
      name: s.name,
      address: s.street,
      street: s.street,
      postalCode: s.postalCode ?? undefined,
      city: s.city,
      country: s.country,
      lat: s.latitude != null ? Number(s.latitude) : undefined,
      lng: s.longitude != null ? Number(s.longitude) : undefined,
      phone: s.phone ?? undefined,
      partnerTypes: s.partnerTypes ?? [],
      isPrimary: s.isPrimary,
      displayOrder: s.displayOrder,
      workingHours: s.workingHours.map((w: DoctorSiteWithHoursAndTariffs['workingHours'][number]) => ({
        id: w.id,
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
        isActive: w.isActive,
      })),
      tariffs: s.tariffs.map((t: DoctorSiteWithHoursAndTariffs['tariffs'][number]) => ({
        id: t.id,
        actType: t.actType,
        label: t.label,
        amount: Number(t.amount),
        currency: t.currency,
        durationMinutes: t.durationMinutes ?? undefined,
      })),
    };
  }

  async createSite(userId: string, dto: CreateDoctorSiteDto) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    await this.ensureBootstrapForDoctor(doctorId);
    const space = await this.db.doctorSpace.findUniqueOrThrow({ where: { doctorId } });

    const count = await this.db.doctorSite.count({
      where: { doctorSpaceId: space.id, deletedAt: null },
    });
    if (count >= 20) throw new BadRequestException('Nombre maximum de sites atteint');

    const site = await this.db.doctorSite.create({
      data: {
        doctorSpaceId: space.id,
        name: dto.name,
        street: dto.street ?? dto.address ?? '',
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country ?? 'MA',
        latitude: dto.lat ?? dto.latitude,
        longitude: dto.lng ?? dto.longitude,
        phone: dto.phone,
        partnerTypes: dto.partnerTypes ?? [],
        isPrimary: dto.isPrimary ?? false,
        displayOrder: dto.displayOrder ?? count,
      },
      include: { workingHours: true, tariffs: true },
    });

    if (dto.isPrimary) {
      await this.db.doctorSite.updateMany({
        where: { doctorSpaceId: space.id, id: { not: site.id }, deletedAt: null },
        data: { isPrimary: false },
      });
      await this.syncPrimarySiteLocationToDoctor(doctorId);
    }

    if (dto.workingHours && typeof dto.workingHours === 'object') {
      const rows = jsonWorkingHoursToSiteRows(site.id, dto.workingHours);
      if (rows.length) await this.db.siteWorkingHour.createMany({ data: rows });
    }

    const full = await this.db.doctorSite.findFirstOrThrow({
      where: { id: site.id },
      include: { workingHours: true, tariffs: true },
    });
    this.fireSearchReindex(doctorId);
    return this.serializeSite(full);
  }

  async updateSite(userId: string, siteId: string, dto: UpdateDoctorSiteDto) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    const site = await this.requireSiteOfDoctor(doctorId, siteId);

    await this.db.doctorSite.update({
      where: { id: site.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.street !== undefined ? { street: dto.street } : {}),
        ...(dto.address !== undefined ? { street: dto.address } : {}),
        ...(dto.postalCode !== undefined ? { postalCode: dto.postalCode } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.lat !== undefined ? { latitude: dto.lat } : {}),
        ...(dto.lng !== undefined ? { longitude: dto.lng } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.partnerTypes !== undefined ? { partnerTypes: dto.partnerTypes } : {}),
        ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
        ...(dto.isPrimary === true ? { isPrimary: true } : {}),
      },
    });

    if (dto.isPrimary === true) {
      await this.db.doctorSite.updateMany({
        where: { doctorSpaceId: site.doctorSpaceId, id: { not: site.id }, deletedAt: null },
        data: { isPrimary: false },
      });
      await this.syncPrimarySiteLocationToDoctor(doctorId);
    }

    const full = await this.db.doctorSite.findFirstOrThrow({
      where: { id: site.id },
      include: { workingHours: true, tariffs: true },
    });
    this.fireSearchReindex(doctorId);
    return this.serializeSite(full);
  }

  async deleteSite(userId: string, siteId: string) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    const site = await this.requireSiteOfDoctor(doctorId, siteId);
    const activeCount = await this.db.doctorSite.count({
      where: { doctorSpaceId: site.doctorSpaceId, deletedAt: null },
    });
    if (activeCount <= 1) {
      throw new BadRequestException('Impossible de supprimer le dernier site actif');
    }
    const now = new Date();
    await this.db.$transaction([
      this.db.tariff.updateMany({
        where: { doctorSiteId: site.id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.db.doctorSite.update({
        where: { id: site.id },
        data: { deletedAt: now, isPrimary: false },
      }),
    ]);
    const other = await this.db.doctorSite.findFirst({
      where: { doctorSpaceId: site.doctorSpaceId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (other) {
      await this.db.doctorSite.update({
        where: { id: other.id },
        data: { isPrimary: true },
      });
      await this.syncPrimarySiteLocationToDoctor(doctorId);
    }
    this.fireSearchReindex(doctorId);
    return { id: siteId, deleted: true };
  }

  async patchSiteWorkingHours(userId: string, siteId: string, dto: PatchSiteWorkingHoursDto) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    const site = await this.requireSiteOfDoctor(doctorId, siteId);

    await this.db.$transaction(async (tx: any) => {
      await tx.siteWorkingHour.deleteMany({ where: { doctorSiteId: site.id } });
      const rows = (dto.hours ?? []).map((h: SiteWorkingHourItemDto) => ({
        id: randomUUID(),
        doctorSiteId: site.id,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime.trim(),
        endTime: h.endTime.trim(),
        isActive: h.isActive !== false,
      }));
      if (rows.length) await tx.siteWorkingHour.createMany({ data: rows });
    });

    if (site.isPrimary) {
      const all = await this.db.siteWorkingHour.findMany({
        where: { doctorSiteId: site.id },
      });
      const json = siteRowsToJsonWorkingHours(all);
      await this.db.doctor.update({
        where: { id: doctorId },
        data: { workingHours: json as Prisma.InputJsonValue },
      });
    }

    const full = await this.db.doctorSite.findFirstOrThrow({
      where: { id: site.id },
      include: { workingHours: true, tariffs: true },
    });
    this.fireSearchReindex(doctorId);
    return this.serializeSite(full);
  }

  async listTariffs(userId: string, siteId?: string) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    await this.ensureBootstrapForDoctor(doctorId);
    const space = await this.db.doctorSpace.findUnique({
      where: { doctorId },
      include: {
        sites: {
          where: { deletedAt: null, ...(siteId ? { id: siteId } : {}) },
          include: {
            tariffs: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });
    const out: Array<{
      id: string;
      doctorSiteId: string;
      siteName: string;
      actType: string;
      label: string;
      amount: number;
      currency: string;
      durationMinutes?: number;
    }> = [];
    for (const s of space?.sites ?? []) {
      for (const t of s.tariffs) {
        out.push({
          id: t.id,
          doctorSiteId: s.id,
          siteName: s.name,
          actType: t.actType,
          label: t.label,
          amount: Number(t.amount),
          currency: t.currency,
          durationMinutes: t.durationMinutes ?? undefined,
        });
      }
    }
    return out;
  }

  async createTariff(userId: string, dto: CreateTariffDto) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    await this.requireSiteOfDoctor(doctorId, dto.doctorSiteId);
    const t = await this.db.tariff.create({
      data: {
        doctorSiteId: dto.doctorSiteId,
        actType: dto.actType,
        label: dto.label,
        amount: dto.amount,
        currency: dto.currency ?? 'MAD',
        durationMinutes: dto.durationMinutes,
      },
    });
    this.fireSearchReindex(doctorId);
    return {
      id: t.id,
      doctorSiteId: t.doctorSiteId,
      actType: t.actType,
      label: t.label,
      amount: Number(t.amount),
      currency: t.currency,
      durationMinutes: t.durationMinutes ?? undefined,
    };
  }

  async updateTariff(userId: string, tariffId: string, dto: UpdateTariffDto) {
    const doctorId = await this.requireDoctorIdByUser(userId);
    const t = await this.db.tariff.findFirst({
      where: { id: tariffId, deletedAt: null },
      include: { doctorSite: { include: { doctorSpace: true } } },
    });
    if (!t || t.doctorSite.doctorSpace.doctorId !== doctorId) {
      throw new NotFoundException('Tarif introuvable');
    }
    const updated = await this.db.tariff.update({
      where: { id: tariffId },
      data: {
        ...(dto.actType !== undefined ? { actType: dto.actType } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.durationMinutes !== undefined ? { durationMinutes: dto.durationMinutes } : {}),
      },
    });
    this.fireSearchReindex(doctorId);
    return {
      id: updated.id,
      doctorSiteId: updated.doctorSiteId,
      actType: updated.actType,
      label: updated.label,
      amount: Number(updated.amount),
      currency: updated.currency,
      durationMinutes: updated.durationMinutes ?? undefined,
    };
  }

  private async requireSiteOfDoctor(doctorId: string, siteId: string) {
    const site = await this.db.doctorSite.findFirst({
      where: { id: siteId, deletedAt: null, doctorSpace: { doctorId } },
    });
    if (!site) throw new NotFoundException('Site introuvable');
    return site;
  }
}
