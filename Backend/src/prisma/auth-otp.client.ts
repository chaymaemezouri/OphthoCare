import type { PrismaService } from './prisma.service';

export type AuthOtpRow = {
  id: string;
  userId: string;
  codeHash: string;
  purpose: string;
  expiresAt: Date;
  consumedAt: Date | null;
};

type AuthOtpDelegate = {
  deleteMany(args: object): Promise<{ count?: number }>;
  create(args: object): Promise<AuthOtpRow>;
  findFirst(args: object): Promise<AuthOtpRow | null>;
  update(args: object): Promise<AuthOtpRow>;
};

export function authOtpChallengeClient(prisma: PrismaService) {
  return (prisma as unknown as { authOtpChallenge: AuthOtpDelegate }).authOtpChallenge;
}
