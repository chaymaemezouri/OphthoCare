import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import type { SanitizedUser } from '@/modules/users/users.service';
import { DoctorsSpaceService } from './doctors-space.service';
import { CreateDoctorStaffDto } from './dto/create-doctor-staff.dto';
import { UpdateDoctorStaffDto } from './dto/update-doctor-staff.dto';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  phoneNumber: true,
  isActive: true,
  lang: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class DoctorStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorsSpaceService: DoctorsSpaceService,
  ) {}

  private async requireDoctorUser(user: SanitizedUser) {
    if (user.role !== UserRole.doctor) {
      throw new ForbiddenException('Seul le médecin peut gérer son équipe');
    }
    const doctor = await this.prisma.doctor.findFirst({
      where: { userId: user.id, deletedAt: null },
      include: { doctorSpace: true },
    });
    if (!doctor) throw new NotFoundException('Profil médecin introuvable');
    const spaceId =
      doctor.doctorSpace?.id ??
      (await this.doctorsSpaceService.getDoctorSpaceIdForDoctor(doctor.id));
    if (!spaceId) throw new BadRequestException('Espace cabinet non initialisé');
    return { doctor, spaceId, spaceName: doctor.doctorSpace?.name ?? 'Cabinet' };
  }

  private dashboardPath(role: UserRole) {
    if (role === UserRole.secretary) return '/dashboard/secretaire';
    if (role === UserRole.trainee) return '/dashboard/stagiaire';
    return '/login';
  }

  async listStaff(user: SanitizedUser) {
    const { spaceId, spaceName } = await this.requireDoctorUser(user);

    const [secretaries, trainees] = await Promise.all([
      this.prisma.secretaryDoctorSpace.findMany({
        where: { doctorSpaceId: spaceId },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.traineeDoctorSpace.findMany({
        where: { doctorSpaceId: spaceId },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const mapRow = (
      linkId: string,
      u: (typeof secretaries)[0]['user'],
      role: 'secretary' | 'trainee',
    ) => ({
      linkId,
      userId: u.id,
      role,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumber: u.phoneNumber,
      isActive: u.isActive,
      lang: u.lang,
      createdAt: u.createdAt.toISOString(),
      dashboardPath: this.dashboardPath(role === 'secretary' ? UserRole.secretary : UserRole.trainee),
      loginUrl: '/login',
    });

    return {
      doctorSpaceId: spaceId,
      doctorSpaceName: spaceName,
      staff: [
        ...secretaries.map((s) => mapRow(s.id, s.user, 'secretary')),
        ...trainees.map((t) => mapRow(t.id, t.user, 'trainee')),
      ],
    };
  }

  async createStaff(user: SanitizedUser, dto: CreateDoctorStaffDto) {
    const { spaceId, spaceName } = await this.requireDoctorUser(user);

    const role = dto.role === 'secretary' ? UserRole.secretary : UserRole.trainee;

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email.trim().toLowerCase(), deletedAt: null },
    });
    if (existing) throw new ConflictException('Cet e-mail est déjà utilisé');

    const hash = await bcrypt.hash(dto.password, 10);
    const email = dto.email.trim().toLowerCase();

    const created = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          password: hash,
          firstName: dto.firstName?.trim() || null,
          lastName: dto.lastName?.trim() || null,
          phoneNumber: dto.phoneNumber?.trim() || null,
          role,
          lang: dto.lang?.trim() || 'fr',
          isActive: true,
        },
        select: userSelect,
      });

      if (role === UserRole.secretary) {
        await tx.secretaryDoctorSpace.create({
          data: { userId: u.id, doctorSpaceId: spaceId },
        });
      } else {
        await tx.traineeDoctorSpace.create({
          data: { userId: u.id, doctorSpaceId: spaceId },
        });
      }

      return u;
    });

    return {
      doctorSpaceName: spaceName,
      member: {
        userId: created.id,
        role: dto.role,
        email: created.email,
        firstName: created.firstName,
        lastName: created.lastName,
        dashboardPath: this.dashboardPath(role),
        loginUrl: '/login',
      },
      credentials: {
        email: created.email,
        temporaryPassword: dto.password,
        message:
          'Communiquez ces identifiants à votre collaborateur. Il pourra se connecter sur /login.',
      },
    };
  }

  async updateStaff(user: SanitizedUser, staffUserId: string, dto: UpdateDoctorStaffDto) {
    const { spaceId } = await this.requireDoctorUser(user);

    const belongs = await this.assertStaffInSpace(staffUserId, spaceId);
    const data: Record<string, unknown> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim() || null;
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim() || null;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber.trim() || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password?.trim()) {
      data.password = await bcrypt.hash(dto.password.trim(), 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: staffUserId },
      data,
      select: userSelect,
    });

    return {
      userId: updated.id,
      role: belongs.role,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phoneNumber: updated.phoneNumber,
      isActive: updated.isActive,
      dashboardPath: this.dashboardPath(
        belongs.role === 'secretary' ? UserRole.secretary : UserRole.trainee,
      ),
    };
  }

  async removeStaff(user: SanitizedUser, staffUserId: string) {
    const { spaceId } = await this.requireDoctorUser(user);
    await this.assertStaffInSpace(staffUserId, spaceId);

    await this.prisma.$transaction(async (tx) => {
      await tx.secretaryDoctorSpace.deleteMany({ where: { userId: staffUserId, doctorSpaceId: spaceId } });
      await tx.traineeDoctorSpace.deleteMany({ where: { userId: staffUserId, doctorSpaceId: spaceId } });
      await tx.user.update({
        where: { id: staffUserId },
        data: { isActive: false, deletedAt: new Date() },
      });
    });

    return { userId: staffUserId, removed: true };
  }

  private async assertStaffInSpace(userId: string, spaceId: string) {
    const sec = await this.prisma.secretaryDoctorSpace.findFirst({
      where: { userId, doctorSpaceId: spaceId },
    });
    if (sec) return { role: 'secretary' as const };

    const tr = await this.prisma.traineeDoctorSpace.findFirst({
      where: { userId, doctorSpaceId: spaceId },
    });
    if (tr) return { role: 'trainee' as const };

    throw new NotFoundException('Collaborateur introuvable dans votre cabinet');
  }
}
