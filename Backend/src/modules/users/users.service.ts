import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PatientsService } from '@/modules/patients/patients.service';
import { DoctorsService } from '@/modules/doctors/doctors.service';

export type SanitizedUser = Omit<User, 'password'>;

const userPublicSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  lang: true,
  twoFactorEnabled: true,
  twoFactorSmsEnabled: true,
  phoneNumber: true,
  metadata: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SanitizedUser> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: createUserDto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          role: createUserDto.role,
          phoneNumber: createUserDto.phoneNumber,
          lang: createUserDto.lang?.trim() || 'fr',
        },
        select: userPublicSelect,
      });

      if (createUserDto.role === UserRole.patient) {
        await tx.patient.create({
          data: { userId: created.id },
        });
      }

      return created;
    });

    if (createUserDto.role === UserRole.patient && createUserDto.patientProfile) {
      const row = await this.prisma.patient.findFirst({
        where: { userId: user.id, deletedAt: null },
        select: { id: true },
      });
      if (row) {
        await this.patientsService.mergeRegisterProfile(row.id, createUserDto.patientProfile);
      }
    }

    return user;
  }

  async findById(id: string): Promise<SanitizedUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userPublicSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findAll(skip = 0, take = 10): Promise<[SanitizedUser[], number]> {
    const where = { deletedAt: null };
    const [rows, count] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: userPublicSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return [rows, count];
  }

  async update(id: string, updateData: Prisma.UserUpdateInput): Promise<SanitizedUser> {
    await this.findById(id);
    const data: Prisma.UserUpdateInput = { ...updateData };
    if (typeof data.password === 'string') {
      data.password = await bcrypt.hash(data.password, 10);
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
    });
    const doctor = await this.prisma.doctor.findFirst({
      where: { userId: id, deletedAt: null },
      select: { id: true },
    });
    if (doctor) {
      void this.doctorsService.reindexDoctorInSearchEngines(doctor.id).catch(() => undefined);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}
