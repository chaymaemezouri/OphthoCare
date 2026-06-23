import { ForbiddenException } from '@nestjs/common';
import { UserRole, type Prisma } from '@prisma/client';
import type { RequestUser } from '@/modules/auth/auth.types';

/** Rôles rattachés à un `DoctorSpace` via JWT `doctorSpaceId`. */
export function isCabinetStaffRole(role: UserRole): boolean {
  return role === UserRole.doctor || role === UserRole.secretary || role === UserRole.trainee;
}

/**
 * Retourne `doctorSpaceId` pour médecin / secrétaire / stagiaire.
 * `null` pour patient (vue agrégée) et admin (pas de filtre tenant).
 */
export function resolveStaffDoctorSpaceId(requester: RequestUser): string | null {
  if (
    requester.role === UserRole.patient ||
    requester.role === UserRole.admin ||
    requester.role === UserRole.super_admin
  ) {
    return null;
  }
  if (!isCabinetStaffRole(requester.role)) {
    throw new ForbiddenException('Rôle non autorisé');
  }
  if (!requester.doctorSpaceId) {
    throw new ForbiddenException('Aucun espace cabinet lié à ce compte');
  }
  return requester.doctorSpaceId;
}

/** Filtre agenda / RDV cabinet : `doctorId` + `doctorSpaceId` (après backfill des lignes legacy). */
export function appointmentWhereForCabinetAgenda(
  doctorId: string,
  doctorSpaceId: string,
  extra?: Prisma.AppointmentWhereInput,
): Prisma.AppointmentWhereInput {
  return {
    doctorId,
    doctorSpaceId,
    deletedAt: null,
    ...extra,
  };
}
