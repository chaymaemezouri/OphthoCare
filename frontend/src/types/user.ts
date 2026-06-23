export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  SECRETARY = 'secretary',
  TRAINEE = 'trainee',
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  /** 2FA SMS (optionnel, côté API Nest) */
  twoFactorSmsEnabled?: boolean;
  /** fr | ar | en */
  lang?: string;
  /** Identifiant `DoctorSpace` (multi-tenant) si rôle médecin */
  doctorSpaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}
