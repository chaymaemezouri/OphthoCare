/** Codes spécialité alignés sur `APP_CONFIG` — enrichir depuis l’API / seed backend. */
export const SPECIALTY_CODES = [
  'ophthalmology',
  'cardiology',
  'dermatology',
  'general-medicine',
] as const;

export type SpecialtyCode = (typeof SPECIALTY_CODES)[number];
