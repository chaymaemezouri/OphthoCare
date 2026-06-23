import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { DOCTOR_SPACE_PARAM_KEY } from '@/common/decorators/doctor-space-param.decorator';
import type { RequestUser } from '@/modules/auth/auth.types';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Vérifie que l’identifiant médecin dans l’URL (`Doctor.id`) appartient au `DoctorSpace`
 * du jeton (`doctorSpaceId` = `DoctorSpace.id`). Admin : pas de contrainte.
 */
@Injectable()
export class DoctorSpaceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName =
      this.reflector.getAllAndOverride<string>(DOCTOR_SPACE_PARAM_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'id';

    const req = context.switchToHttp().getRequest<{ user?: RequestUser; params: Record<string, string> }>();
    const user = req.user;
    const resourceDoctorId = req.params[paramName];
    if (!resourceDoctorId) {
      return true;
    }
    if (!user) {
      throw new ForbiddenException('Authentification requise');
    }
    if (user.role === UserRole.admin || user.role === UserRole.super_admin) {
      return true;
    }
    if (user.role !== UserRole.doctor) {
      return true;
    }
    if (!user.doctorSpaceId) {
      throw new ForbiddenException('Profil médecin incomplet');
    }
    const doc = await this.prisma.doctor.findFirst({
      where: { id: resourceDoctorId, deletedAt: null },
      select: { id: true },
    });
    if (!doc) {
      throw new ForbiddenException('Accès non autorisé à cet espace médecin');
    }
    const space = await (this.prisma as unknown as { doctorSpace: { findUnique: (args: unknown) => Promise<{ id: string } | null> } }).doctorSpace.findUnique({
      where: { doctorId: doc.id },
      select: { id: true },
    });
    if (!space || space.id !== user.doctorSpaceId) {
      throw new ForbiddenException('Accès non autorisé à cet espace médecin');
    }
    return true;
  }
}
