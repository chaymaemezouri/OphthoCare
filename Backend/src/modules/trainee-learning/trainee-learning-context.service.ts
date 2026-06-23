import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { PatientsService } from '@/modules/patients/patients.service';
import type { RequestUser } from '@/modules/auth/auth.types';

export type TraineeContext = {
  userId: string;
  doctorSpaceId: string;
  doctorId: string;
};

@Injectable()
export class TraineeLearningContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientsService: PatientsService,
  ) {}

  async requireTrainee(user: RequestUser): Promise<TraineeContext> {
    if (user.role !== UserRole.trainee) {
      throw new ForbiddenException('Réservé au stagiaire');
    }
    if (!user.doctorSpaceId) {
      throw new ForbiddenException('Aucun espace cabinet lié à ce compte');
    }
    const link = await this.prisma.traineeDoctorSpace.findUnique({
      where: { userId: user.id },
      include: { doctorSpace: { select: { id: true, doctorId: true } } },
    });
    if (!link?.doctorSpace || link.doctorSpace.id !== user.doctorSpaceId) {
      throw new ForbiddenException('Cabinet invalide');
    }
    return {
      userId: user.id,
      doctorSpaceId: link.doctorSpace.id,
      doctorId: link.doctorSpace.doctorId,
    };
  }

  async assertPatientAccess(user: RequestUser, patientId: string): Promise<void> {
    await this.patientsService.assertCanAccessPatient(user, patientId);
  }

  async assertSessionOwnership(user: RequestUser, sessionId: string) {
    const ctx = await this.requireTrainee(user);
    const session = await this.prisma.traineeLearningSession.findFirst({
      where: { id: sessionId, userId: ctx.userId, doctorSpaceId: ctx.doctorSpaceId },
    });
    if (!session) throw new NotFoundException('Session introuvable');
    return { ctx, session };
  }
}
