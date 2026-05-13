// User Types
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
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Doctor Types
export interface Doctor {
  id: string;
  user: User;
  specialtyCode: string;
  subSpecialties?: string[];
  licenseNumber?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  city: string;
  street: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  consultationPrice: number;
  workingHours?: Record<string, any>;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorDto {
  specialtyCode: string;
  city: string;
  street: string;
  postalCode: string;
  consultationPrice: number;
  licenseNumber?: string;
  bio?: string;
}

// Patient Types
export interface MedicalData {
  allergies?: string[];
  bloodGroup?: string;
  chronicDiseases?: string[];
  medications?: Array<{ name: string; dosage: string; duration: string }>;
}

export interface Patient {
  id: string;
  user: User;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  medicalData?: MedicalData;
  insuranceProvider?: string;
  insuranceNumber?: string;
  familyMembers?: Array<{ name: string; relationship: string; dateOfBirth: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  dateOfBirth?: string;
  gender?: string;
  medicalData?: MedicalData;
}

// Specialty Types
export interface Specialty {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  doctorCount: number;
  createdAt: string;
  updatedAt: string;
}

// Appointment Types
export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  IN_PERSON = 'in-person',
  VIDEO = 'video',
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  patient: Patient;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  doctorId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  reason?: string;
  type: AppointmentType;
}

// Consultation Types
export interface Consultation {
  id: string;
  doctor: Doctor;
  patient: Patient;
  appointment?: Appointment;
  consultationDate: string;
  symptoms?: string;
  diagnosis?: string;
  clinicalData?: Record<string, any>;
  treatment?: string;
  duration?: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationDto {
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  symptoms?: string;
  diagnosis?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

// Error Types
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// Search Types
export interface SearchFilters {
  specialty?: string;
  city?: string;
  rating?: number;
  priceMin?: number;
  priceMax?: number;
  isVerified?: boolean;
}

export interface DoctorSearchResult {
  doctor: Doctor;
  distance?: number;
  matchScore: number;
}

// Booking Types
export interface TimeSlot {
  time: string;
  available: boolean;
  doctorId: string;
}

export interface AvailableDates {
  date: string;
  slots: TimeSlot[];
}
