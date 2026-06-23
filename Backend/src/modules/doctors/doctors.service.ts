import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, UserRole, AppointmentStatus } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '@/prisma/prisma.service';
import { scheduleBlockClient } from '@/prisma/schedule-block.client';
import { UpdateDoctorMeDto } from './dto/update-doctor-me.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { parseIcsWeeklyHours } from './ics-import.util';
import type { SanitizedUser } from '@/modules/users/users.service';
import { randomUUID } from 'crypto';
import { DoctorSearchIndexService } from './doctor-search-index.service';
import type { DoctorIndexDocument } from './doctor-search-index.service';
import { DoctorsSpaceService } from './doctors-space.service';

const doctorInclude = {
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
      lang: true,
    },
  },
  specialty: { select: { code: true, name: true } },
  doctorSpace: {
    select: {
      id: true,
      name: true,
      sites: {
        where: { deletedAt: null, isPrimary: true },
        take: 1,
        select: { country: true },
      },
    },
  },
} satisfies Prisma.DoctorInclude;

type DoctorRow = Prisma.DoctorGetPayload<{ include: typeof doctorInclude }>;

const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorSearchIndex: DoctorSearchIndexService,
    private readonly doctorsSpaceService: DoctorsSpaceService,
  ) {}

  async findDoctorIdForUser(userId: string): Promise<string | null> {
    const d = await this.prisma.doctor.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    return d?.id ?? null;
  }

  /** Médecin connecté ou médecin du cabinet lié à une secrétaire. */
  async resolveDoctorIdForAgendaUser(user: SanitizedUser): Promise<string> {
    if (user.role === UserRole.doctor) {
      const id = await this.findDoctorIdForUser(user.id);
      if (!id) throw new NotFoundException('Profil médecin introuvable');
      return id;
    }
    if (user.role === UserRole.secretary) {
      const link = await this.prisma.secretaryDoctorSpace.findUnique({
        where: { userId: user.id },
        include: { doctorSpace: { select: { doctorId: true } } },
      });
      if (!link?.doctorSpace) throw new ForbiddenException('Aucun cabinet lié');
      return link.doctorSpace.doctorId;
    }
    throw new ForbiddenException('Rôle non autorisé');
  }

  private async requireDoctorByUser(userId: string): Promise<DoctorRow> {
    const doc = await this.prisma.doctor.findFirst({
      where: { userId, deletedAt: null },
      include: doctorInclude,
    });
    if (!doc?.user) throw new NotFoundException('Profil médecin introuvable');
    return doc;
  }

  async getMe(userId: string) {
    const doc = await this.requireDoctorByUser(userId);
    return this.serializeDoctor(doc);
  }

  async updateMe(userId: string, dto: UpdateDoctorMeDto) {
    const doc = await this.requireDoctorByUser(userId);
    const data: Prisma.DoctorUpdateInput = {};

    if (dto.specialtyCode !== undefined) {
      const sp = await this.prisma.specialty.findFirst({
        where: { code: dto.specialtyCode, deletedAt: null },
      });
      if (!sp) throw new BadRequestException('Spécialité inconnue');
      data.specialty = { connect: { code: dto.specialtyCode } };
    }
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.licenseNumber !== undefined) data.licenseNumber = dto.licenseNumber;
    if (dto.subSpecialties !== undefined) data.subSpecialties = dto.subSpecialties;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.street !== undefined) data.street = dto.street;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.consultationPrice !== undefined) {
      data.consultationPrice = dto.consultationPrice;
    }
    if (dto.slotDurationMinutes !== undefined) {
      if (dto.slotDurationMinutes < 15 || dto.slotDurationMinutes > 120) {
        throw new BadRequestException('slotDurationMinutes doit être entre 15 et 120');
      }
      (data as Record<string, unknown>).slotDurationMinutes = dto.slotDurationMinutes;
    }
    if (dto.orderNumber !== undefined) data.orderNumber = dto.orderNumber;
    if (dto.preferredCurrency !== undefined) data.preferredCurrency = dto.preferredCurrency;
    if (dto.workingHours !== undefined) {
      data.workingHours = dto.workingHours as Prisma.InputJsonValue;
    }

    if (dto.practiceSites !== undefined) {
      if (dto.practiceSites.length === 0) {
        (data as Record<string, unknown>).practiceSites = Prisma.JsonNull;
      } else {
        const sites = dto.practiceSites.map((s) => ({
          id: s.id ?? randomUUID(),
          name: s.name,
          street: s.street,
          city: s.city,
          postalCode: s.postalCode,
          consultationPrice:
            s.consultationPrice != null ? Number(s.consultationPrice) : Number(doc.consultationPrice),
          workingHours: s.workingHours,
          isPrimary: Boolean(s.isPrimary),
        }));
        const primary = sites.find((s) => s.isPrimary) ?? sites[0];
        if (primary) {
          data.city = primary.city;
          data.street = primary.street;
          data.postalCode = primary.postalCode;
          data.consultationPrice = primary.consultationPrice;
        }
        (data as Record<string, unknown>).practiceSites = sites as unknown as Prisma.InputJsonValue;
      }
    }

    if (dto.lang !== undefined && dto.lang.trim() !== '') {
      await this.prisma.user.update({
        where: { id: doc.user!.id },
        data: { lang: dto.lang.trim() },
      });
    }

    let doctorRow = doc;
    if (Object.keys(data).length > 0) {
      doctorRow = await this.prisma.doctor.update({
        where: { id: doc.id },
        data: data as unknown as Prisma.DoctorUpdateInput,
        include: doctorInclude,
      });
    } else if (dto.lang !== undefined && dto.lang.trim() !== '') {
      doctorRow = await this.prisma.doctor.findFirstOrThrow({
        where: { id: doc.id },
        include: doctorInclude,
      });
    }

    if (dto.workingHours !== undefined) {
      await this.doctorsSpaceService.syncJsonWorkingHoursToPrimarySite(doctorRow.id, dto.workingHours);
    }

    const finalDoc = await this.prisma.doctor.findFirstOrThrow({
      where: { id: doc.id },
      include: doctorInclude,
    });
    void this.syncDoctorSearchIndex(finalDoc.id);
    return this.serializeDoctor(finalDoc);
  }

  async setProfilePhotoUrl(userId: string, relativeUrl: string) {
    const doc = await this.requireDoctorByUser(userId);
    await this.prisma.doctor.update({
      where: { id: doc.id },
      data: { profilePhotoUrl: relativeUrl } as Prisma.DoctorUpdateInput,
    });
    void this.syncDoctorSearchIndex(doc.id);
    return { profilePhotoUrl: relativeUrl };
  }

  async importIcsWorkingHours(userId: string, icsText: string) {
    const doc = await this.requireDoctorByUser(userId);
    const { workingHours, warnings } = parseIcsWeeklyHours(icsText);
    if (Object.keys(workingHours).length === 0) {
      return { workingHours: doc.workingHours ?? {}, warnings, applied: false };
    }
    await this.prisma.doctor.update({
      where: { id: doc.id },
      data: { workingHours: workingHours as Prisma.InputJsonValue },
    });
    await this.doctorsSpaceService.syncJsonWorkingHoursToPrimarySite(doc.id, workingHours);
    void this.syncDoctorSearchIndex(doc.id);
    return { workingHours, warnings, applied: true };
  }

  async findAll(skip = 0, take = 20) {
    const rows = await this.prisma.doctor.findMany({
      where: { deletedAt: null, isSuspended: false },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: doctorInclude,
    });
    return rows.map((d) => this.serializeDoctor(d));
  }

  async findById(id: string) {
    const doc = await this.prisma.doctor.findFirst({
      where: { id, deletedAt: null, isSuspended: false },
      include: doctorInclude,
    });
    if (!doc) throw new NotFoundException('Doctor not found');
    return this.serializeDoctor(doc);
  }

  async findPublicProfile(id: string) {
    const doc = await this.prisma.doctor.findFirst({
      where: { id, deletedAt: null, isSuspended: false },
      include: doctorInclude,
    });
    if (!doc?.user) throw new NotFoundException('Doctor not found');
    const base = this.serializeDoctor(doc);
    const sites = await this.doctorsSpaceService.listSitesForPublicDoctor(id);
    const tariffs = sites.flatMap(
      (s: {
        id: string;
        name: string;
        tariffs: Array<{
          id: string;
          actType: string;
          label: string;
          amount: number;
          currency: string;
          durationMinutes?: number;
        }>;
      }) =>
        s.tariffs.map((t) => ({
        id: t.id,
        doctorSiteId: s.id,
        siteName: s.name,
        actType: t.actType,
        label: t.label,
        amount: t.amount,
        currency: t.currency,
        durationMinutes: t.durationMinutes,
      })),
    );
    const approvedReviews = await this.prisma.doctorReview.findMany({
      where: { doctorId: id, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 24,
      select: { id: true, rating: true, comment: true, createdAt: true },
    });
    return {
      ...base,
      sites,
      tariffs,
      approvedReviews: approvedReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      nextAvailableSlot: await this.findNextAvailableSlot(id),
    };
  }

  async search(params: {
    specialtyCode?: string;
    city?: string;
    q?: string;
    minRating?: number;
    maxPrice?: number;
    isVerified?: boolean;
    isCertified?: boolean;
    availableOn?: string;
    skip?: number;
    take?: number;
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const take = Math.min(Math.max(1, params.take ?? 50), 100);
    const availabilityDate = params.availableOn?.trim();
    if (availabilityDate && !/^\d{4}-\d{2}-\d{2}$/.test(availabilityDate)) {
      throw new BadRequestException('availableOn doit être au format YYYY-MM-DD');
    }

    const esBase = {
      q: params.q,
      specialtyCode: params.specialtyCode,
      city: params.city,
      minRating: params.minRating,
      maxPrice: params.maxPrice,
      isVerified: params.isVerified,
      isCertified: params.isCertified,
    };

    if (availabilityDate) {
      let candidateRows: DoctorRow[] = [];
      let usedElasticsearch = false;
      if (this.doctorSearchIndex.isClientReady()) {
        try {
          const { ids } = await this.doctorSearchIndex.searchIds({
            ...esBase,
            from: 0,
            size: 100,
          });
          usedElasticsearch = true;
          if (ids.length > 0) {
            const doctors = await this.prisma.doctor.findMany({
              where: { id: { in: ids }, deletedAt: null, isSuspended: false },
              include: doctorInclude,
            });
            const order = new Map(ids.map((id, i) => [id, i]));
            candidateRows = doctors.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
          }
        } catch (e) {
          this.logger.warn(`Recherche ES (disponibilité) repli Prisma: ${String(e)}`);
          candidateRows = await this.searchPrismaRows(params, 100);
          usedElasticsearch = false;
        }
      } else {
        candidateRows = await this.searchPrismaRows(params, 100);
      }

      const availableRows: DoctorRow[] = [];
      for (const row of candidateRows) {
        if (await this.hasFreeSlotOn(row.id, availabilityDate)) {
          availableRows.push(row);
        }
      }
      const total = availableRows.length;
      const page = availableRows.slice(skip, skip + take);
      const items = await this.enrichSearchItems(page);
      return {
        items,
        total,
        skip,
        take,
        usedElasticsearch,
      };
    }

    if (this.doctorSearchIndex.isClientReady()) {
      try {
        const { ids, total } = await this.doctorSearchIndex.searchIds({
          ...esBase,
          from: skip,
          size: take,
        });
        if (ids.length === 0) {
          return { items: [], total, skip, take, usedElasticsearch: true };
        }
        const doctors = await this.prisma.doctor.findMany({
          where: { id: { in: ids }, deletedAt: null, isSuspended: false },
          include: doctorInclude,
        });
        const order = new Map(ids.map((id, i) => [id, i]));
        const sorted = [...doctors].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        const items = await this.enrichSearchItems(sorted);
        return {
          items,
          total,
          skip,
          take,
          usedElasticsearch: true,
        };
      } catch (e) {
        this.logger.warn(`Recherche Elasticsearch échouée, repli Prisma: ${String(e)}`);
      }
    }

    const where: Prisma.DoctorWhereInput = { AND: this.buildSearchWhereParts(params) };
    const total = await this.prisma.doctor.count({ where });
    const rows = await this.prisma.doctor.findMany({
      where,
      skip,
      take,
      orderBy: { rating: 'desc' },
      include: doctorInclude,
    });
    const items = await this.enrichSearchItems(rows);
    return {
      items,
      total,
      skip,
      take,
      usedElasticsearch: false,
    };
  }

  async searchFilterSpecialties() {
    const rows = await this.prisma.doctor.findMany({
      where: { deletedAt: null, isSuspended: false },
      select: { specialtyCode: true },
      distinct: ['specialtyCode'],
    });
    const codes = rows.map((r) => r.specialtyCode);
    if (codes.length === 0) return [];
    return this.prisma.specialty.findMany({
      where: { code: { in: codes }, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { code: true, name: true },
    });
  }

  async searchFilterCities() {
    const rows = await this.prisma.doctor.findMany({
      where: { deletedAt: null, isSuspended: false },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return rows.map((r) => r.city).filter((c) => Boolean(c?.trim()));
  }

  /** Réindexation ES (hook espace cabinet / admin). */
  async reindexDoctorInSearchEngines(doctorId: string): Promise<void> {
    await this.syncDoctorSearchIndex(doctorId);
  }

  async reindexSearchEngine() {
    if (!this.doctorSearchIndex.isClientReady()) {
      const total = await this.prisma.doctor.count({ where: { deletedAt: null } });
      return {
        indexed: 0,
        total,
        elasticsearch: false,
        message: 'Définissez ELASTICSEARCH_URL et redémarrez l’API pour indexer dans Elasticsearch.',
      };
    }
    const rows = await this.prisma.doctor.findMany({
      where: { deletedAt: null, isSuspended: false },
      include: doctorInclude,
    });
    let ok = 0;
    for (const d of rows) {
      try {
        const doc = await this.buildElasticsearchDocumentFromDoctorRow(d);
        await this.doctorSearchIndex.indexDoctor(doc);
        ok += 1;
      } catch (e) {
        this.logger.warn(`Indexation ${d.id}: ${String(e)}`);
      }
    }
    return { indexed: ok, total: rows.length, elasticsearch: true };
  }

  private async syncDoctorSearchIndex(doctorId: string): Promise<void> {
    try {
      const doc = await this.prisma.doctor.findFirst({
        where: { id: doctorId, deletedAt: null },
        include: doctorInclude,
      });
      if (!doc) {
        await this.doctorSearchIndex.removeDoctor(doctorId);
        return;
      }
      const s = this.serializeDoctor(doc);
      if (s.isSuspended) {
        await this.doctorSearchIndex.removeDoctor(doctorId);
        return;
      }
      const payload = await this.buildElasticsearchDocumentFromDoctorRow(doc);
      await this.doctorSearchIndex.indexDoctor(payload);
    } catch (e) {
      this.logger.warn(`syncDoctorSearchIndex: ${String(e)}`);
    }
  }

  private async tariffMinMaxForDoctor(doctorId: string): Promise<{ min: number; max: number } | null> {
    const row = await this.prisma.tariff.aggregate({
      where: {
        deletedAt: null,
        doctorSite: {
          deletedAt: null,
          doctorSpace: { doctorId },
        },
      },
      _min: { amount: true },
      _max: { amount: true },
    });
    const minA = row._min.amount;
    const maxA = row._max.amount;
    if (minA == null || maxA == null) return null;
    return { min: Number(minA), max: Number(maxA) };
  }

  private primaryCountryFromRow(doc: DoctorRow): string {
    const sites = doc.doctorSpace?.sites;
    const c = sites?.[0]?.country;
    return (c ?? 'MA').trim() || 'MA';
  }

  private languagesFromRow(doc: DoctorRow): string[] {
    const lang = doc.user?.lang?.trim();
    return lang ? [lang] : ['fr'];
  }

  private async buildElasticsearchDocumentFromDoctorRow(doc: DoctorRow): Promise<DoctorIndexDocument> {
    const s = this.serializeDoctor(doc);
    const mm = await this.tariffMinMaxForDoctor(doc.id);
    const consult = s.consultationPrice;
    const minPrice = mm ? Math.min(mm.min, consult) : consult;
    const maxPrice = mm ? Math.max(mm.max, consult) : consult;
    return this.doctorSearchIndex.toDocument({
      id: s.id,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      specialtyCode: s.specialtyCode,
      specialtyName: s.specialtyName ?? s.specialtyCode,
      city: s.city,
      country: this.primaryCountryFromRow(doc),
      street: s.street,
      postalCode: s.postalCode,
      latitude: s.latitude,
      longitude: s.longitude,
      consultationPrice: consult,
      minPrice,
      maxPrice,
      rating: s.rating,
      reviewCount: s.reviewCount,
      isVerified: s.isVerified,
      isCertified: s.isCertified ?? false,
      languages: this.languagesFromRow(doc),
    });
  }

  private async findNextAvailableSlot(
    doctorId: string,
    opts?: { maxDays?: number },
  ): Promise<{ date: string; startTime: string; endTime: string } | null> {
    const maxDays = opts?.maxDays ?? 45;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = 0; d < maxDays; d++) {
      const cur = new Date(today);
      cur.setDate(cur.getDate() + d);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const day = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      try {
        const { slots } = await this.getAvailability(doctorId, dateStr);
        const first = slots.find((slot) => slot.available);
        if (first) {
          return { date: dateStr, startTime: first.startTime, endTime: first.endTime };
        }
      } catch {
        /* continue */
      }
    }
    return null;
  }

  private async enrichSearchItem(doc: DoctorRow) {
    return {
      ...this.serializeDoctor(doc),
      nextAvailableSlot: await this.findNextAvailableSlot(doc.id),
    };
  }

  private async enrichSearchItems(rows: DoctorRow[]) {
    return Promise.all(rows.map((r) => this.enrichSearchItem(r)));
  }

  private async hasFreeSlotOn(doctorId: string, date: string): Promise<boolean> {
    try {
      const { slots } = await this.getAvailability(doctorId, date);
      return slots.some((s) => s.available);
    } catch {
      return false;
    }
  }

  private buildSearchWhereParts(params: {
    specialtyCode?: string;
    city?: string;
    q?: string;
    minRating?: number;
    maxPrice?: number;
    isVerified?: boolean;
    isCertified?: boolean;
  }): Prisma.DoctorWhereInput[] {
    const filters: Prisma.DoctorWhereInput[] = [{ deletedAt: null }, { isSuspended: false }];

    if (params.specialtyCode?.trim()) {
      filters.push({ specialtyCode: params.specialtyCode.trim() });
    }
    if (params.city?.trim()) {
      filters.push({
        city: { contains: params.city.trim(), mode: 'insensitive' },
      });
    }
    if (params.q?.trim()) {
      const q = params.q.trim();
      filters.push({
        OR: [
          { user: { firstName: { contains: q, mode: 'insensitive' } } },
          { user: { lastName: { contains: q, mode: 'insensitive' } } },
          { city: { contains: q, mode: 'insensitive' } },
          { street: { contains: q, mode: 'insensitive' } },
          { specialty: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }
    if (params.minRating != null && !Number.isNaN(params.minRating)) {
      filters.push({ rating: { gte: params.minRating } });
    }
    if (params.maxPrice != null && !Number.isNaN(params.maxPrice)) {
      filters.push({
        OR: [
          { consultationPrice: { lte: params.maxPrice } },
          {
            doctorSpace: {
              is: {
                sites: {
                  some: {
                    deletedAt: null,
                    tariffs: {
                      some: { deletedAt: null, amount: { lte: params.maxPrice } },
                    },
                  },
                },
              },
            },
          },
        ],
      });
    }
    if (params.isVerified === true) {
      filters.push({ isVerified: true });
    }
    if (params.isCertified === true) {
      filters.push({ isCertified: true });
    }
    return filters;
  }

  private async searchPrismaRows(
    params: {
      specialtyCode?: string;
      city?: string;
      q?: string;
      minRating?: number;
      maxPrice?: number;
      isVerified?: boolean;
      isCertified?: boolean;
    },
    limit: number,
  ): Promise<DoctorRow[]> {
    return this.prisma.doctor.findMany({
      where: { AND: this.buildSearchWhereParts(params) },
      take: limit,
      orderBy: { rating: 'desc' },
      include: doctorInclude,
    });
  }
  async createByAdmin(dto: CreateDoctorDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role !== UserRole.doctor) {
      throw new BadRequestException("L'utilisateur doit avoir le rôle doctor");
    }
    const existing = await this.prisma.doctor.findFirst({
      where: { userId: dto.userId, deletedAt: null },
    });
    if (existing) throw new BadRequestException('Ce praticien possède déjà une fiche médecin');

    const sp = await this.prisma.specialty.findFirst({
      where: { code: dto.specialtyCode, deletedAt: null },
    });
    if (!sp) throw new BadRequestException('Spécialité inconnue');

    const row = await this.prisma.doctor.create({
      data: {
        userId: dto.userId,
        specialtyCode: dto.specialtyCode,
        city: dto.city,
        street: dto.street,
        postalCode: dto.postalCode,
        consultationPrice: dto.consultationPrice ?? 0,
        bio: dto.bio,
        licenseNumber: dto.licenseNumber,
        workingHours: (dto.workingHours as Prisma.InputJsonValue) ?? undefined,
      },
      include: doctorInclude,
    });
    await this.doctorsSpaceService.ensureBootstrapForDoctor(row.id);
    const full = await this.prisma.doctor.findFirstOrThrow({
      where: { id: row.id },
      include: doctorInclude,
    });
    void this.syncDoctorSearchIndex(full.id);
    return this.serializeDoctor(full);
  }

  async updateByAdmin(id: string, dto: UpdateDoctorMeDto) {
    const doc = await this.prisma.doctor.findFirst({
      where: { id, deletedAt: null },
      include: doctorInclude,
    });
    if (!doc) throw new NotFoundException('Doctor not found');
    return this.updateMe(doc.user!.id, dto);
  }

  async softDeleteByAdmin(id: string) {
    const doc = await this.prisma.doctor.findFirst({
      where: { id, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Doctor not found');
    await this.prisma.doctor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    void this.doctorSearchIndex.removeDoctor(id);
    return { id, deleted: true };
  }

  async getAvailability(doctorId: string, date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    const doc = await this.prisma.doctor.findFirst({
      where: { id: doctorId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Doctor not found');

    const ext = doc as typeof doc & { slotDurationMinutes?: number; isSuspended?: boolean };
    const slotDurationMin = ext.slotDurationMinutes ?? 30;
    const [y, mo, da] = date.split('-').map((x) => parseInt(x, 10));
    const localNoon = new Date(y, mo - 1, da, 12, 0, 0, 0);
    const dayKey = WEEK_KEYS[localNoon.getDay()];
    const dow = localNoon.getDay();

    if (ext.isSuspended) {
      return { doctorId, date, dayKey, slotDurationMinutes: slotDurationMin, slots: [] };
    }

    const parseHm = (s: string) => {
      const [h, m] = s.split(':').map((x) => parseInt(x, 10));
      return h * 60 + m;
    };

    const dayStart = new Date(y, mo - 1, da, 0, 0, 0, 0).getTime();
    const dayEnd = dayStart + 86400000;

    const slots: { startTime: string; endTime: string; available: boolean }[] = [];

    let merged = await this.doctorsSpaceService.getMergedWorkingMinuteRanges(doctorId, dow);
    if (merged.length === 0) {
      const wh = (doc.workingHours as Record<string, string[]>) || {};
      const ranges = wh[dayKey] || [];
      const raw: { start: number; end: number }[] = [];
      for (const range of ranges) {
        const [a, b] = range.split('-').map((x) => x.trim());
        if (!a || !b) continue;
        const start = parseHm(a);
        const end = parseHm(b);
        if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) raw.push({ start, end });
      }
      raw.sort((x, y) => x.start - y.start);
      merged = [];
      for (const r of raw) {
        const last = merged[merged.length - 1];
        if (!last || r.start > last.end) merged.push({ ...r });
        else last.end = Math.max(last.end, r.end);
      }
    }

    for (const r of merged) {
      let cur = r.start;
      while (cur + slotDurationMin <= r.end) {
        const sMs = dayStart + cur * 60 * 1000;
        const eMs = dayStart + (cur + slotDurationMin) * 60 * 1000;
        slots.push({
          startTime: new Date(sMs).toISOString(),
          endTime: new Date(eMs).toISOString(),
          available: true,
        });
        cur += slotDurationMin;
      }
    }

    const appts = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        status: { not: 'cancelled' },
        startTime: { lt: new Date(dayEnd) },
        endTime: { gt: new Date(dayStart) },
      },
      select: { startTime: true, endTime: true },
    });

    const blocks = await scheduleBlockClient(this.prisma).findMany({
      where: {
        doctorId,
        startTime: { lt: new Date(dayEnd) },
        endTime: { gt: new Date(dayStart) },
      },
      select: { startTime: true, endTime: true },
    });

    for (const s of slots) {
      const sT = new Date(s.startTime).getTime();
      const eT = new Date(s.endTime).getTime();
      const clashAppt = appts.some(
        (a) => a.startTime.getTime() < eT && a.endTime.getTime() > sT,
      );
      const clashBlock = blocks.some(
        (b) => b.startTime.getTime() < eT && b.endTime.getTime() > sT,
      );
      if (clashAppt || clashBlock) s.available = false;
    }

    return { doctorId, date, dayKey, slotDurationMinutes: slotDurationMin, slots };
  }

  /**
   * Créneaux libres pour un site : horaires `SiteWorkingHour`, pas de RDV pending/confirmed/in_progress,
   * pas de blocage agenda (bloc global médecin ou bloc sur ce site).
   */
  async getAvailabilityForSite(
    doctorId: string,
    siteId: string,
    date: string,
    durationMinutes?: number,
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    await this.doctorsSpaceService.assertSiteBelongsToDoctor(doctorId, siteId);
    const doc = await this.prisma.doctor.findFirst({
      where: { id: doctorId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Doctor not found');

    const slotDurationMin = doc.slotDurationMinutes ?? 30;
    const apptDuration = Math.min(240, Math.max(15, durationMinutes ?? slotDurationMin));
    const step = slotDurationMin;

    const [y, mo, da] = date.split('-').map((x) => parseInt(x, 10));
    const localNoon = new Date(y, mo - 1, da, 12, 0, 0, 0);
    const dayKey = WEEK_KEYS[localNoon.getDay()];
    const dow = localNoon.getDay();

    const ext = doc as typeof doc & { isSuspended?: boolean };
    if (ext.isSuspended) {
      return {
        doctorId,
        siteId,
        date,
        dayKey,
        slotDurationMinutes: slotDurationMin,
        appointmentDurationMinutes: apptDuration,
        slots: [] as { startTime: string; endTime: string }[],
      };
    }

    const dayStart = new Date(y, mo - 1, da, 0, 0, 0, 0).getTime();
    const dayEnd = dayStart + 86400000;

    const merged = await this.doctorsSpaceService.getMergedWorkingMinuteRangesForSite(siteId, dow);

    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    for (const r of merged) {
      let cur = r.start;
      while (cur + apptDuration <= r.end) {
        const sMs = dayStart + cur * 60 * 1000;
        const eMs = dayStart + (cur + apptDuration) * 60 * 1000;
        slots.push({
          startTime: new Date(sMs).toISOString(),
          endTime: new Date(eMs).toISOString(),
          available: true,
        });
        cur += step;
      }
    }

    const blockingStatuses = [
      AppointmentStatus.pending,
      AppointmentStatus.confirmed,
      AppointmentStatus.in_progress,
    ];

    const appts = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        status: { in: blockingStatuses },
        startTime: { lt: new Date(dayEnd) },
        endTime: { gt: new Date(dayStart) },
      },
      select: { startTime: true, endTime: true },
    });

    const blocks = await scheduleBlockClient(this.prisma).findMany({
      where: {
        doctorId,
        startTime: { lt: new Date(dayEnd) },
        endTime: { gt: new Date(dayStart) },
      },
      select: { startTime: true, endTime: true, doctorSiteId: true },
    });

    for (const s of slots) {
      const sT = new Date(s.startTime).getTime();
      const eT = new Date(s.endTime).getTime();
      const clashAppt = appts.some(
        (a) => a.startTime.getTime() < eT && a.endTime.getTime() > sT,
      );
      const clashBlock = blocks.some((b) => {
        const overlaps = b.startTime.getTime() < eT && b.endTime.getTime() > sT;
        if (!overlaps) return false;
        const bid = (b as { doctorSiteId?: string | null }).doctorSiteId;
        if (bid == null || bid === siteId) return true;
        return false;
      });
      if (clashAppt || clashBlock) s.available = false;
    }

    const free = slots.filter((x) => x.available).map(({ startTime, endTime }) => ({ startTime, endTime }));

    return {
      doctorId,
      siteId,
      date,
      dayKey,
      slotDurationMinutes: slotDurationMin,
      appointmentDurationMinutes: apptDuration,
      slots: free,
    };
  }

  async getAvailabilityMulti(doctorIds: string[], date: string) {
    const unique = [...new Set(doctorIds)].filter(Boolean).slice(0, 12);
    const doctors: Record<
      string,
      {
        doctorId: string;
        date: string;
        dayKey: string;
        slotDurationMinutes: number;
        slots: { startTime: string; endTime: string; available: boolean }[];
      }
    > = {};
    for (const id of unique) {
      try {
        doctors[id] = await this.getAvailability(id, date);
      } catch {
        doctors[id] = {
          doctorId: id,
          date,
          dayKey: 'mon',
          slotDurationMinutes: 30,
          slots: [],
        };
      }
    }
    return { date, doctors };
  }

  async listMyScheduleBlocks(user: SanitizedUser, from?: string, to?: string) {
    const doctorId = await this.resolveDoctorIdForAgendaUser(user);
    const where: Prisma.ScheduleBlockWhereInput = { doctorId };
    if (from || to) {
      where.AND = [
        ...(from ? [{ endTime: { gte: new Date(from) } }] : []),
        ...(to ? [{ startTime: { lte: new Date(to) } }] : []),
      ];
    }
    const rows = await scheduleBlockClient(this.prisma).findMany({
      where,
      orderBy: { startTime: 'asc' },
    });
    return rows.map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      kind: b.kind,
      note: b.note ?? undefined,
      doctorSiteId: (b as { doctorSiteId?: string | null }).doctorSiteId ?? undefined,
    }));
  }

  async createMyScheduleBlock(user: SanitizedUser, dto: CreateScheduleBlockDto) {
    const doctorId = await this.resolveDoctorIdForAgendaUser(user);
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
      throw new BadRequestException('startTime invalide');
    }
    if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('endTime invalide');
    }
    if (end <= start) throw new BadRequestException('endTime doit être après startTime');
    const spaceId = await this.doctorsSpaceService.getDoctorSpaceIdForDoctor(doctorId);
    let doctorSiteId: string | undefined = dto.doctorSiteId;
    if (doctorSiteId) {
      await this.doctorsSpaceService.assertSiteBelongsToDoctor(doctorId, doctorSiteId);
    }
    const row = await scheduleBlockClient(this.prisma).create({
      data: {
        doctorId,
        doctorSpaceId: spaceId ?? undefined,
        doctorSiteId: doctorSiteId ?? undefined,
        startTime: start,
        endTime: end,
        kind: dto.kind ?? 'absence',
        note: dto.note,
      },
    });
    return {
      id: row.id,
      startTime: row.startTime.toISOString(),
      endTime: row.endTime.toISOString(),
      kind: row.kind,
      note: row.note ?? undefined,
      doctorSiteId: (row as { doctorSiteId?: string | null }).doctorSiteId ?? undefined,
    };
  }

  async deleteMyScheduleBlock(user: SanitizedUser, blockId: string) {
    const doctorId = await this.resolveDoctorIdForAgendaUser(user);
    const b = await scheduleBlockClient(this.prisma).findFirst({
      where: { id: blockId, doctorId },
    });
    if (!b) throw new NotFoundException('Bloc introuvable');
    await scheduleBlockClient(this.prisma).delete({ where: { id: blockId } });
    return { id: blockId, deleted: true };
  }

  async exportAppointmentsIcs(user: SanitizedUser, from?: string, to?: string) {
    const doctorId = await this.resolveDoctorIdForAgendaUser(user);
    const gte = from ? new Date(from) : new Date();
    const lte = to ? new Date(to) : new Date(Date.now() + 90 * 86400000);
    const appts = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        status: { not: 'cancelled' },
        startTime: { gte, lte },
      },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
    const esc = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OphthoCare//FR', 'CALSCALE:GREGORIAN'];
    for (const a of appts) {
      const u = a.patient.user;
      const summary = esc(`RDV ${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || 'Consultation');
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${a.id}@ophthocare`);
      lines.push(`DTSTAMP:${fmt(new Date())}`);
      lines.push(`DTSTART:${fmt(a.startTime)}`);
      lines.push(`DTEND:${fmt(a.endTime)}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  async calendarSyncStub(user: SanitizedUser, provider?: string) {
    await this.resolveDoctorIdForAgendaUser(user);
    return {
      connected: false,
      provider: provider ?? 'none',
      message:
        'OAuth Google / Microsoft non configuré. Exportez vos RDV en ICS (GET /doctors/me/appointments.ics) ou importez vos horaires depuis le profil.',
    };
  }

  async listAppointmentsForDoctor(user: SanitizedUser, from?: string, to?: string) {
    const doctorId = await this.resolveDoctorIdForAgendaUser(user);
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    if (!from && !to) {
      range.gte = new Date();
      range.lte = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    const rows = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        startTime: range,
      },
      take: 100,
      orderBy: { startTime: 'asc' },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    return rows.map((a) => ({
      id: a.id,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      status: a.status,
      type: a.type,
      visitKind: (a as { visitKind?: string }).visitKind,
      siteId: (a as { doctorSiteId?: string | null }).doctorSiteId ?? undefined,
      reason: a.reason ?? undefined,
      notes: a.notes ?? undefined,
      patient: {
        id: a.patient.id,
        user: a.patient.user,
      },
    }));
  }

  /**
   * Patients de l’espace cabinet (accès PatientDoctorAccess — 1er RDV confirmé).
   */
  async listPatientsForDoctor(
    userId: string,
    opts: { q?: string; skip?: number; take?: number },
  ) {
    const doctorId = await this.findDoctorIdForUser(userId);
    if (!doctorId) throw new NotFoundException('Profil médecin introuvable');

    const space = await this.prisma.doctorSpace.findUnique({
      where: { doctorId },
      select: { id: true },
    });
    if (!space) {
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
      doctorSpaceId: space.id,
      patient: { deletedAt: null, ...patientUserFilter },
    };

    const spacePatientAccessInclude = {
      patient: {
        select: {
          id: true,
          dateOfBirth: true,
          diagnoses: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    } satisfies Prisma.PatientDoctorAccessInclude;

    type SpacePatientAccessRow = Prisma.PatientDoctorAccessGetPayload<{
      include: typeof spacePatientAccessInclude;
    }>;

    const [total, accesses] = (await this.prisma.$transaction([
      this.prisma.patientDoctorAccess.count({ where }),
      this.prisma.patientDoctorAccess.findMany({
        where,
        orderBy: { lastVisit: 'desc' },
        skip,
        take,
        include: spacePatientAccessInclude,
      }),
    ])) as [number, SpacePatientAccessRow[]];

    type Item = {
      id: string;
      displayName: string;
      email?: string;
      age?: number;
      lastVisitAt: string;
      condition: string;
      status: string;
    };

    const firstDiagnosisLabel = (diagnoses: unknown): string | undefined => {
      if (!Array.isArray(diagnoses) || diagnoses.length === 0) return undefined;
      const d = diagnoses[0] as { label?: string };
      return typeof d?.label === 'string' && d.label.trim() ? d.label.trim() : undefined;
    };

    const ageFromDob = (dob: Date | null): number | undefined => {
      if (!dob) return undefined;
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
      return age >= 0 ? age : undefined;
    };

    const patientIds = accesses.map((a) => a.patientId);
    const latestAppts =
      patientIds.length === 0
        ? []
        : await this.prisma.appointment.findMany({
            where: {
              doctorId,
              patientId: { in: patientIds },
              deletedAt: null,
            },
            orderBy: { startTime: 'desc' },
            select: {
              patientId: true,
              startTime: true,
              status: true,
              reason: true,
            },
          });

    const latestByPatient = new Map<string, (typeof latestAppts)[0]>();
    for (const a of latestAppts) {
      if (!latestByPatient.has(a.patientId)) latestByPatient.set(a.patientId, a);
    }

    const statusLabel = (s: string): string => {
      switch (s) {
        case 'cancelled':
          return 'Annulé';
        case 'no_show':
          return 'Absent';
        case 'completed':
          return 'Consulté';
        case 'confirmed':
          return 'Actif';
        case 'pending':
          return 'En attente';
        case 'in_progress':
          return 'En cours';
        default:
          return s;
      }
    };

    const items: Item[] = accesses.map((acc) => {
      const p = acc.patient;
      const u = p.user;
      const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
      const displayName = name || u?.email || 'Patient';
      const diag = firstDiagnosisLabel(p.diagnoses);
      const ap = latestByPatient.get(p.id);
      const condition = diag ?? (ap?.reason?.trim() || '—');
      const st = ap?.status ?? 'confirmed';
      return {
        id: p.id,
        displayName,
        email: u?.email ?? undefined,
        age: ageFromDob(p.dateOfBirth),
        lastVisitAt: acc.lastVisit.toISOString(),
        condition,
        status: statusLabel(st),
      };
    });

    return { items, total, skip, take };
  }

  async countTodayAppointments(userId: string) {
    const doctorId = await this.findDoctorIdForUser(userId);
    if (!doctorId) return { count: 0, doctorId: null as string | null };
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const count = await this.prisma.appointment.count({
      where: {
        doctorId,
        deletedAt: null,
        status: { not: 'cancelled' },
        startTime: { gte: start, lt: end },
      },
    });
    return { count, doctorId };
  }

  async setSignaturePrivateRef(userId: string, privateRef: string) {
    const doc = await this.requireDoctorByUser(userId);
    await this.prisma.doctor.update({
      where: { id: doc.id },
      data: { signatureUrl: privateRef },
    });
    return { hasSignature: true };
  }

  async getSignatureAbsolutePathForDownload(userId: string): Promise<string> {
    const doc = await this.requireDoctorByUser(userId);
    const key = doc.signatureUrl?.trim();
    if (!key?.startsWith('private:sig:')) {
      throw new NotFoundException('Signature absente ou non téléchargeable depuis ce endpoint');
    }
    const rel = key.slice('private:sig:'.length);
    if (!rel.startsWith(`${doc.id}/`)) {
      throw new BadRequestException('Référence signature invalide');
    }
    const full = join(process.cwd(), 'private', 'doctor-signatures', rel);
    if (!existsSync(full)) throw new NotFoundException('Fichier signature introuvable');
    return full;
  }

  private serializeDoctor(doc: DoctorRow) {
    const u = doc.user!;
    const ext = doc as DoctorRow & {
      profilePhotoUrl?: string | null;
      practiceSites?: unknown;
      slotDurationMinutes?: number | null;
      orderNumber?: string | null;
      preferredCurrency?: string | null;
      isCertified?: boolean | null;
      isSuspended?: boolean | null;
      signatureUrl?: string | null;
    };
    const practiceSites = ext.practiceSites as unknown[] | null | undefined;
    const sig = ext.signatureUrl?.trim();
    const hasSignature = Boolean(sig);
    return {
      id: doc.id,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      doctorSpace: doc.doctorSpace
        ? { id: doc.doctorSpace.id, name: doc.doctorSpace.name }
        : undefined,
      specialtyCode: doc.specialtyCode,
      specialtyName: doc.specialty.name,
      subSpecialties: (() => {
        const raw = doc.subSpecialties;
        if (!raw) return undefined;
        if (Array.isArray(raw)) {
          return raw.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
        }
        if (typeof raw === 'string') {
          return raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return undefined;
      })(),
      licenseNumber: doc.licenseNumber ?? undefined,
      orderNumber: ext.orderNumber ?? undefined,
      preferredCurrency: ext.preferredCurrency ?? 'MAD',
      isCertified: ext.isCertified ?? false,
      isSuspended: ext.isSuspended ?? false,
      bio: doc.bio ?? undefined,
      profilePhotoUrl: ext.profilePhotoUrl ?? undefined,
      hasSignature,
      practiceSites: practiceSites ?? undefined,
      rating: Number(doc.rating),
      reviewCount: doc.reviewCount,
      city: doc.city,
      country: (() => {
        const sites = doc.doctorSpace?.sites;
        const c = sites?.[0]?.country;
        return (c ?? 'MA').trim() || 'MA';
      })(),
      street: doc.street,
      postalCode: doc.postalCode,
      latitude: doc.latitude != null ? Number(doc.latitude) : undefined,
      longitude: doc.longitude != null ? Number(doc.longitude) : undefined,
      consultationPrice: Number(doc.consultationPrice),
      slotDurationMinutes: ext.slotDurationMinutes ?? 30,
      workingHours: (doc.workingHours as Record<string, unknown>) ?? {},
      isVerified: doc.isVerified,
      user: {
        id: u.id,
        email: u.email,
        firstName: u.firstName ?? undefined,
        lastName: u.lastName ?? undefined,
        role: u.role,
        phoneNumber: u.phoneNumber ?? undefined,
        lang: u.lang ?? undefined,
        isActive: u.isActive,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      },
    };
  }
}
