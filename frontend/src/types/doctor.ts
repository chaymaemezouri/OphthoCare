import type { User } from './user';

export interface PracticeSite {
  id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  consultationPrice?: number;
  workingHours?: Record<string, string[]>;
  isPrimary?: boolean;
}

export interface SiteWorkingHourRow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface DoctorSiteTariffRow {
  id: string;
  actType: string;
  label: string;
  amount: number;
  currency: string;
  durationMinutes?: number;
}

export interface DoctorSiteDetail {
  id: string;
  doctorSpaceId: string;
  name: string;
  address: string;
  street: string;
  postalCode?: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  phone?: string;
  partnerTypes: string[];
  isPrimary: boolean;
  displayOrder: number;
  workingHours: SiteWorkingHourRow[];
  tariffs: DoctorSiteTariffRow[];
}

export interface DoctorTariffListRow extends DoctorSiteTariffRow {
  doctorSiteId: string;
  siteName: string;
}

export interface Doctor {
  id: string;
  user: User;
  doctorSpace?: { id: string; name: string };
  specialtyCode: string;
  specialtyName?: string;
  subSpecialties?: string[];
  licenseNumber?: string;
  orderNumber?: string;
  preferredCurrency?: string;
  isCertified?: boolean;
  isSuspended?: boolean;
  bio?: string;
  profilePhotoUrl?: string;
  hasSignature?: boolean;
  practiceSites?: PracticeSite[];
  /** Sites cabinet (API espace médecin / profil public enrichi). */
  sites?: DoctorSiteDetail[];
  rating: number;
  reviewCount: number;
  city: string;
  /** Pays (site principal), ex. MA */
  country?: string;
  street: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  consultationPrice: number;
  slotDurationMinutes?: number;
  workingHours?: Record<string, unknown>;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  /** Prochain créneau libre (recherche annuaire). */
  nextAvailableSlot?: { date: string; startTime: string; endTime: string } | null;
}

export interface CreateDoctorDto {
  userId: string;
  specialtyCode: string;
  city: string;
  street: string;
  postalCode: string;
  consultationPrice?: number;
  bio?: string;
  licenseNumber?: string;
  workingHours?: Record<string, unknown>;
}

export interface UpdateDoctorMePayload {
  specialtyCode?: string;
  bio?: string;
  subSpecialties?: string;
  licenseNumber?: string;
  orderNumber?: string;
  preferredCurrency?: string;
  lang?: 'fr' | 'ar' | 'en';
  city?: string;
  street?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  consultationPrice?: number;
  workingHours?: Record<string, unknown>;
  practiceSites?: PracticeSite[];
  slotDurationMinutes?: number;
}

/** GET /doctors/:id/public-profile */
export interface DoctorPublicProfile extends Doctor {
  sites?: DoctorSiteDetail[];
  tariffs?: DoctorTariffListRow[];
  approvedReviews: { id: string; rating: number; comment: string; createdAt: string }[];
}

/** Ligne liste « Mes patients » (médecin), issue des RDV. */
export interface DoctorMyPatientRow {
  id: string;
  displayName: string;
  email?: string;
  age?: number;
  lastVisitAt: string;
  condition: string;
  status: string;
}

export interface DoctorMyPatientListResponse {
  items: DoctorMyPatientRow[];
  total: number;
  skip: number;
  take: number;
}

/** Réponse de GET /doctors/me/appointments (sérialisation backend). */
export interface DoctorMeAppointmentRow {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason?: string;
  notes?: string;
  patient: {
    id: string;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
    } | null;
  };
}
