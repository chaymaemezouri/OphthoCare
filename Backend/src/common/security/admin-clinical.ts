import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/** Les administrateurs plateforme ne doivent jamais accéder au contenu médical. */
export function assertAdminNoClinicalData(role: UserRole | string | undefined): void {
  if (role === UserRole.admin || role === UserRole.super_admin) {
    throw new ForbiddenException(
      'Les administrateurs plateforme n’ont pas accès aux données médicales. Utilisez le tableau de bord admin.',
    );
  }
}

export function isPlatformAdminRole(role: UserRole | string | undefined): boolean {
  return role === UserRole.admin || role === UserRole.super_admin;
}
