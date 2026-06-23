import type { SanitizedUser } from '@/modules/users/users.service';

/** Utilisateur attaché à `req.user` après JWT (incl. espace médecin = `Doctor.id`, guide §2.1). */
export type RequestUser = SanitizedUser & { doctorSpaceId?: string | null };
