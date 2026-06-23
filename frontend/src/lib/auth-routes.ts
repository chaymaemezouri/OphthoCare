/** Redirection interne sûre après login (évite open redirect). */
export function safeReturnUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const path = decodeURIComponent(raw.trim());
    if (!path.startsWith('/') || path.startsWith('//')) return null;
    if (path.includes('://')) return null;
    return path;
  } catch {
    return null;
  }
}

/** Chemin tableau de bord selon le rôle API (Prisma UserRole). */
export function dashboardPathForRole(role?: string | null): string {  switch (role) {
    case "doctor":
      return "/dashboard/medecin";
    case "secretary":
      return "/dashboard/secretaire";
    case "trainee":
      return "/dashboard/stagiaire";
    case "admin":
    case "super_admin":
      return "/dashboard/admin";
    case "patient":
      return "/dashboard/patient";
    default:
      return "/login";
  }
}

export function roleLabelFr(role?: string | null): string {
  switch (role) {
    case "doctor":
      return "Médecin";
    case "secretary":
      return "Secrétaire";
    case "trainee":
      return "Stagiaire";
    case "admin":
      return "Administrateur";
    case "patient":
      return "Patient";
    default:
      return "Utilisateur";
  }
}
