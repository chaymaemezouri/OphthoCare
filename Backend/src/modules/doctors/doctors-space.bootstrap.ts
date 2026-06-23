import type { PrismaClient } from '@prisma/client';
import { jsonWorkingHoursToSiteRows } from './doctors-space-hours.util';
/**
 * Logique partagée (seeds, migrations manuelles) — crée espace + site principal + horaires + tarif.
 */
export async function bootstrapDoctorSpace(prisma: PrismaClient, doctorId: string): Promise<void> {
  const existing = await prisma.doctorSpace.findUnique({ where: { doctorId } });
  if (existing) return;

  const doc = await prisma.doctor.findFirst({
    where: { id: doctorId, deletedAt: null },
    include: { user: { select: { firstName: true, lastName: true, phoneNumber: true } } },
  });
  if (!doc) return;

  const spaceName =
    doc.user?.lastName || doc.user?.firstName
      ? `Cabinet Dr ${[doc.user?.firstName, doc.user?.lastName].filter(Boolean).join(' ').trim()}`
      : 'Cabinet';

  await prisma.$transaction(async (tx) => {
    const space = await tx.doctorSpace.create({
      data: {
        doctorId,
        name: spaceName,
      },
    });
    const site = await tx.doctorSite.create({
      data: {
        doctorSpaceId: space.id,
        name: 'Site principal',
        street: doc.street,
        postalCode: doc.postalCode,
        city: doc.city,
        country: 'MA',
        latitude: doc.latitude ?? undefined,
        longitude: doc.longitude ?? undefined,
        phone: doc.user?.phoneNumber ?? undefined,
        isPrimary: true,
        displayOrder: 0,
      },
    });
    const rows = jsonWorkingHoursToSiteRows(site.id, doc.workingHours);
    if (rows.length > 0) {
      await tx.siteWorkingHour.createMany({ data: rows });
    }
    await tx.tariff.create({
      data: {
        doctorSiteId: site.id,
        actType: 'consultation',
        label: 'Consultation',
        amount: doc.consultationPrice,
        currency: doc.preferredCurrency ?? 'MAD',
      },
    });
  });
}
