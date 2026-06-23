import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { DoctorsSpaceService } from '@/modules/doctors/doctors-space.service';
import { PatientsService } from '@/modules/patients/patients.service';
import type { RequestUser } from '@/modules/auth/auth.types';

export type DoctorToolsContext = {
  doctorId: string;
  doctorSpaceId: string;
  userId: string;
};

export type CabinetStaffContext = DoctorToolsContext;

@Injectable()
export class DoctorToolsContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorsSpace: DoctorsSpaceService,
    private readonly patientsService: PatientsService,
  ) {}

  async requireDoctor(user: RequestUser): Promise<DoctorToolsContext> {
    if (user.role !== UserRole.doctor && user.role !== UserRole.admin) {
      throw new ForbiddenException('Réservé au médecin');
    }
    if (user.role === UserRole.admin) {
      throw new ForbiddenException('Utilisez un compte médecin pour cette action');
    }
    const doctorId = await this.doctorsSpace.requireDoctorIdByUser(user.id);
    const spaceId =
      user.doctorSpaceId ?? (await this.doctorsSpace.getDoctorSpaceIdForDoctor(doctorId));
    if (!spaceId) throw new NotFoundException('Espace cabinet non initialisé');
    return { doctorId, doctorSpaceId: spaceId, userId: user.id };
  }

  async assertPatientAccess(user: RequestUser, patientId: string): Promise<void> {
    await this.patientsService.assertCanAccessPatient(user, patientId);
  }

  /** Médecin ou secrétaire du même cabinet (messages, actions accueil). */
  async requireCabinetStaff(user: RequestUser): Promise<CabinetStaffContext> {
    if (user.role === UserRole.doctor) {
      return this.requireDoctor(user);
    }
    if (user.role === UserRole.secretary) {
      if (!user.doctorSpaceId) {
        throw new ForbiddenException('Aucun espace cabinet lié à ce compte');
      }
      const link = await this.prisma.secretaryDoctorSpace.findUnique({
        where: { userId: user.id },
        include: { doctorSpace: { select: { id: true, doctorId: true } } },
      });
      if (!link?.doctorSpace || link.doctorSpace.id !== user.doctorSpaceId) {
        throw new ForbiddenException('Cabinet invalide');
      }
      return {
        doctorId: link.doctorSpace.doctorId,
        doctorSpaceId: link.doctorSpace.id,
        userId: user.id,
      };
    }
    throw new ForbiddenException('Réservé au personnel du cabinet');
  }
}
