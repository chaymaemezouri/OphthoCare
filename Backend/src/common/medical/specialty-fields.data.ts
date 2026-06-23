/**
 * Gabarits `SpecialtyField[]` (phase 2-BIS) — clés alignées sur `structuredData`.
 */
export type SpecialtyFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'boolean'
  | 'range'
  | 'multiselect';

export type SpecialtyFieldJson = {
  key: string;
  label: string;
  type: SpecialtyFieldType;
  options?: string[];
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
};

export const GENERIC_TEMPLATE_FIELDS: SpecialtyFieldJson[] = [
  { key: 'observations', label: 'Observations cliniques', type: 'text' },
  { key: 'poids', label: 'Poids', type: 'number', unit: 'kg' },
  { key: 'taille', label: 'Taille', type: 'number', unit: 'cm' },
  { key: 'ta', label: 'Tension artérielle', type: 'text' },
  { key: 'fc', label: 'Fréquence cardiaque', type: 'number', unit: 'bpm' },
  { key: 'temperature', label: 'Température', type: 'number', unit: '°C' },
];

export const OPHTHALMOLOGY_FIELDS: SpecialtyFieldJson[] = [
  { key: 'acuiteOD', label: 'Acuité visuelle OD', type: 'number', unit: '/10' },
  { key: 'acuiteOG', label: 'Acuité visuelle OG', type: 'number', unit: '/10' },
  { key: 'pio', label: 'Pression intra-oculaire', type: 'number', unit: 'mmHg' },
  { key: 'refraction', label: 'Réfraction', type: 'text' },
  { key: 'correction', label: 'Correction optique', type: 'text' },
  { key: 'oct', label: 'Historique OCT', type: 'text' },
  { key: 'segmentAnt', label: 'Segment antérieur', type: 'text' },
  { key: 'fondOeil', label: "Fond d'œil", type: 'text' },
];

export const CARDIOLOGY_FIELDS: SpecialtyFieldJson[] = [
  { key: 'fc', label: 'Fréquence cardiaque', type: 'number', unit: 'bpm' },
  { key: 'taSys', label: 'TA systolique', type: 'number', unit: 'mmHg' },
  { key: 'taDia', label: 'TA diastolique', type: 'number', unit: 'mmHg' },
  { key: 'fractionEjection', label: "Fraction d'éjection", type: 'number', unit: '%' },
  { key: 'ecg', label: 'Historique ECG', type: 'text' },
  { key: 'auscultation', label: 'Auscultation', type: 'text' },
];

export const DERMATOLOGY_FIELDS: SpecialtyFieldJson[] = [
  {
    key: 'phototype',
    label: 'Phototype',
    type: 'select',
    options: ['I', 'II', 'III', 'IV', 'V', 'VI'],
  },
  { key: 'lesions', label: 'Description des lésions', type: 'text' },
  { key: 'dermoscopie', label: 'Dermoscopie', type: 'text' },
  { key: 'localisation', label: 'Localisation', type: 'text' },
];

export const GYNECOLOGY_FIELDS: SpecialtyFieldJson[] = [
  { key: 'cycle', label: 'Cycle menstruel', type: 'text' },
  { key: 'parite', label: 'Parité', type: 'number' },
  { key: 'gestate', label: 'Gestité', type: 'number' },
  { key: 'dlr', label: 'Date des dernières règles', type: 'date' },
  { key: 'echo', label: 'Écho obstétricale', type: 'text' },
];

export const PEDIATRICS_FIELDS: SpecialtyFieldJson[] = [
  { key: 'poids', label: 'Poids', type: 'number', unit: 'kg' },
  { key: 'taille', label: 'Taille', type: 'number', unit: 'cm' },
  { key: 'pc', label: 'Périmètre crânien', type: 'number', unit: 'cm' },
  { key: 'developpement', label: 'Développement psychomoteur', type: 'text' },
  { key: 'vaccinations', label: 'Carnet de vaccinations', type: 'text' },
];

export const NEUROLOGY_FIELDS: SpecialtyFieldJson[] = [
  { key: 'gcs', label: 'Score GCS', type: 'number', min: 3, max: 15 },
  { key: 'nihss', label: 'Score NIHSS', type: 'number' },
  { key: 'reflexes', label: 'Réflexes', type: 'text' },
  { key: 'motricite', label: 'Motricité', type: 'text' },
];

export const PNEUMOLOGY_FIELDS: SpecialtyFieldJson[] = [
  { key: 'spo2', label: 'Saturation O2', type: 'number', unit: '%' },
  { key: 'peakFlow', label: 'Peak Flow', type: 'number', unit: 'L/min' },
  { key: 'efr', label: 'EFR', type: 'text' },
  { key: 'auscultation', label: 'Auscultation pulmonaire', type: 'text' },
];

export const ORTHOPEDICS_FIELDS: SpecialtyFieldJson[] = [
  { key: 'localisation', label: 'Localisation douleurs', type: 'text' },
  { key: 'scoresFonctionnels', label: 'Scores fonctionnels', type: 'text' },
  { key: 'mobilite', label: 'Mobilité articulaire', type: 'text' },
];

export const GENERAL_MEDICINE_FIELDS: SpecialtyFieldJson[] = [
  { key: 'poids', label: 'Poids', type: 'number', unit: 'kg' },
  { key: 'taille', label: 'Taille', type: 'number', unit: 'cm' },
  { key: 'imc', label: 'IMC', type: 'number', unit: 'kg/m²' },
  { key: 'ta', label: 'Tension artérielle', type: 'text' },
  { key: 'fc', label: 'Fréquence cardiaque', type: 'number', unit: 'bpm' },
  { key: 'temperature', label: 'Température', type: 'number', unit: '°C' },
];

/** Spécialités « de base » (endocrino, rhumato, etc.) */
export const BASIC_SPECIALTY_FIELDS: SpecialtyFieldJson[] = [...GENERIC_TEMPLATE_FIELDS];

export const SPECIALTY_FIELDS_BY_CODE: Record<string, SpecialtyFieldJson[]> = {
  ophthalmology: OPHTHALMOLOGY_FIELDS,
  cardiology: CARDIOLOGY_FIELDS,
  dermatology: DERMATOLOGY_FIELDS,
  gynecology: GYNECOLOGY_FIELDS,
  pediatrics: PEDIATRICS_FIELDS,
  neurology: NEUROLOGY_FIELDS,
  pneumology: PNEUMOLOGY_FIELDS,
  orthopedics: ORTHOPEDICS_FIELDS,
  'general-medicine': GENERAL_MEDICINE_FIELDS,
  endocrinology: BASIC_SPECIALTY_FIELDS,
  rheumatology: BASIC_SPECIALTY_FIELDS,
  urology: BASIC_SPECIALTY_FIELDS,
  ent: BASIC_SPECIALTY_FIELDS,
  'pediatric-ophthalmology': [...OPHTHALMOLOGY_FIELDS, { key: 'ageCorrected', label: 'Âge corrigé (prématurité)', type: 'text' }],
  psychiatry: BASIC_SPECIALTY_FIELDS,
  gastroenterology: BASIC_SPECIALTY_FIELDS,
  nephrology: BASIC_SPECIALTY_FIELDS,
  hematology: BASIC_SPECIALTY_FIELDS,
  oncology: BASIC_SPECIALTY_FIELDS,
  surgery: BASIC_SPECIALTY_FIELDS,
  radiology: BASIC_SPECIALTY_FIELDS,
};
