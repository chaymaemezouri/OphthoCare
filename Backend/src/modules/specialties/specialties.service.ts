import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Specialty } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  GENERIC_TEMPLATE_FIELDS,
  SPECIALTY_FIELDS_BY_CODE,
} from '@/common/medical/specialty-fields.data';
import type { SpecialtyFieldJson } from '@/common/medical/specialty-fields.data';
import { CreateSpecialtyAdminDto } from './dto/create-specialty-admin.dto';
import { PatchSpecialtyAdminDto } from './dto/patch-specialty-admin.dto';

function isSpecialtyFieldArray(v: unknown): v is SpecialtyFieldJson[] {
  return (
    Array.isArray(v) &&
    v.every(
      (x) =>
        x &&
        typeof x === 'object' &&
        typeof (x as SpecialtyFieldJson).key === 'string' &&
        typeof (x as SpecialtyFieldJson).label === 'string' &&
        typeof (x as SpecialtyFieldJson).type === 'string',
    )
  );
}

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  resolveTemplateFields(row: {
    code: string;
    specificFields: unknown;
  }): SpecialtyFieldJson[] {
    if (isSpecialtyFieldArray(row.specificFields)) {
      return row.specificFields;
    }
    return SPECIALTY_FIELDS_BY_CODE[row.code] ?? GENERIC_TEMPLATE_FIELDS;
  }

  async findAll(): Promise<Specialty[]> {
    return this.prisma.specialty.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findByCode(code: string): Promise<Specialty> {
    const specialty = await this.prisma.specialty.findFirst({
      where: { code, deletedAt: null },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return specialty;
  }

  async getTemplateByCode(code: string): Promise<{
    code: string;
    name: string | null;
    examTypes: string[];
    fields: SpecialtyFieldJson[];
  }> {
    const row = await this.prisma.specialty.findFirst({
      where: { code, deletedAt: null },
      select: { code: true, name: true, specificFields: true, examTypes: true },
    });
    if (!row) {
      return {
        code,
        name: null,
        examTypes: [],
        fields: SPECIALTY_FIELDS_BY_CODE[code] ?? GENERIC_TEMPLATE_FIELDS,
      };
    }
    return {
      code: row.code,
      name: row.name,
      examTypes: row.examTypes ?? [],
      fields: this.resolveTemplateFields(row),
    };
  }

  async createAdmin(dto: CreateSpecialtyAdminDto): Promise<Specialty> {
    if (!isSpecialtyFieldArray(dto.specificFields)) {
      throw new BadRequestException('specificFields doit être un tableau de SpecialtyField');
    }
    return this.prisma.specialty.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim(),
        icon: dto.icon?.trim(),
        specificFields: dto.specificFields as unknown as Prisma.InputJsonValue,
        examTypes: dto.examTypes ?? [],
      },
    });
  }

  async patchAdmin(id: string, dto: PatchSpecialtyAdminDto): Promise<Specialty> {
    const existing = await this.prisma.specialty.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Specialty not found');
    if (dto.specificFields !== undefined && !isSpecialtyFieldArray(dto.specificFields)) {
      throw new BadRequestException('specificFields doit être un tableau de SpecialtyField');
    }
    return this.prisma.specialty.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        icon: dto.icon?.trim(),
        specificFields:
          dto.specificFields !== undefined
            ? (dto.specificFields as unknown as Prisma.InputJsonValue)
            : undefined,
        examTypes: dto.examTypes ?? undefined,
      },
    });
  }

  async seedSpecialties(records: Prisma.SpecialtyCreateInput[]): Promise<Specialty[]> {
    const saved: Specialty[] = [];

    for (const record of records) {
      const row = await this.prisma.specialty.upsert({
        where: { code: record.code as string },
        create: {
          code: record.code as string,
          name: record.name as string,
          description: record.description ?? undefined,
          icon: record.icon ?? undefined,
          defaultFields: record.defaultFields ?? undefined,
          specificFields: record.specificFields ?? undefined,
          examTypes: record.examTypes ?? [],
          doctorCount: record.doctorCount ?? 0,
        },
        update: {
          name: record.name as string,
          description: record.description ?? undefined,
          icon: record.icon ?? undefined,
          defaultFields: record.defaultFields ?? undefined,
          specificFields: record.specificFields ?? undefined,
          examTypes: record.examTypes ?? undefined,
        },
      });
      saved.push(row);
    }

    return saved;
  }
}
