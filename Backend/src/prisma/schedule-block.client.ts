import type { PrismaService } from './prisma.service';

/** Ligne `schedule_blocks` telle que renvoyée par Prisma à l’exécution. */
export type ScheduleBlockRow = {
  id: string;
  startTime: Date;
  endTime: Date;
  kind: string;
  note: string | null;
  doctorId?: string;
  doctorSiteId?: string | null;
  doctorSpaceId?: string | null;
};

type ScheduleBlockDelegate = {
  findFirst(args: object): Promise<ScheduleBlockRow | null>;
  findMany(args: object): Promise<ScheduleBlockRow[]>;
  create(args: object): Promise<ScheduleBlockRow>;
  delete(args: object): Promise<ScheduleBlockRow>;
};

/**
 * Delegate `scheduleBlock` — présent à l’exécution après migration + `prisma generate`.
 * Si `prisma generate` échoue (EPERM Windows), le `@prisma/client` typé peut ne pas exposer
 * `scheduleBlock` sur `PrismaService` : ce helper restaure le typage sans casser le runtime.
 */
export function scheduleBlockClient(prisma: PrismaService) {
  return (prisma as unknown as { scheduleBlock: ScheduleBlockDelegate }).scheduleBlock;
}
