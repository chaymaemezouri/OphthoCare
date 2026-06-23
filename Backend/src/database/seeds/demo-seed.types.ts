import type { PrismaClient } from '@prisma/client';

export type DemoSeedCore = {
  prisma: PrismaClient;
  passwordHash: string;
  doctor: { id: string };
  doctorUser: { id: string; email: string };
  doctorSpaceId: string;
  doctorSiteId: string | null;
  secretaryUserId: string;
  traineeUserId: string;
  mainPatient: { id: string; userId: string };
};

export type DemoPatientRef = {
  id: string;
  userId: string;
  email: string;
  label: string;
};
