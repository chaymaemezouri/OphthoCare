import type { Prisma } from '@prisma/client';
import {
  BASIC_SPECIALTY_FIELDS,
  CARDIOLOGY_FIELDS,
  DERMATOLOGY_FIELDS,
  GENERAL_MEDICINE_FIELDS,
  GYNECOLOGY_FIELDS,
  NEUROLOGY_FIELDS,
  OPHTHALMOLOGY_FIELDS,
  ORTHOPEDICS_FIELDS,
  PEDIATRICS_FIELDS,
  PNEUMOLOGY_FIELDS,
  SPECIALTY_FIELDS_BY_CODE,
} from '@/common/medical/specialty-fields.data';

type SeedRow = {
  code: string;
  name: string;
  description: string;
  icon: string;
  specificFields: unknown;
  examTypes: string[];
};

const exam = (...t: string[]) => t;

function row(
  code: string,
  name: string,
  description: string,
  icon: string,
  fields: unknown,
  types = exam('Consultation', 'Suivi'),
): SeedRow {
  return { code, name, description, icon, specificFields: fields, examTypes: types };
}

/** Données initiales alignées phase 2-BIS (templates JSON + types d’examen). */
export const SPECIALTIES_SEED: SeedRow[] = [
  row('ophthalmology', 'Ophtalmologie', 'Médecine des yeux et troubles visuels', 'eye', OPHTHALMOLOGY_FIELDS),
  row('cardiology', 'Cardiologie', 'Médecine du cœur et système vasculaire', 'heart', CARDIOLOGY_FIELDS),
  row('dermatology', 'Dermatologie', 'Médecine de la peau', 'skin', DERMATOLOGY_FIELDS),
  row('general-medicine', 'Médecine Générale', 'Médecine généraliste', 'stethoscope', GENERAL_MEDICINE_FIELDS),
  row('gynecology', 'Gynécologie', 'Médecine des femmes et obstétrique', 'female', GYNECOLOGY_FIELDS),
  row('pediatrics', 'Pédiatrie', 'Médecine des enfants', 'baby', PEDIATRICS_FIELDS),
  row('neurology', 'Neurologie', 'Médecine du système nerveux', 'brain', NEUROLOGY_FIELDS),
  row('orthopedics', 'Orthopédie', 'Médecine des os et articulations', 'bone', ORTHOPEDICS_FIELDS),
  row('psychiatry', 'Psychiatrie', 'Médecine mentale et comportement', 'mind', SPECIALTY_FIELDS_BY_CODE.psychiatry),
  row('radiology', 'Radiologie', 'Imagerie médicale', 'xray', SPECIALTY_FIELDS_BY_CODE.radiology),
  row('urology', 'Urologie', 'Médecine du système urinaire', 'urine', SPECIALTY_FIELDS_BY_CODE.urology),
  row('gastroenterology', 'Gastro-entérologie', 'Médecine du système digestif', 'stomach', SPECIALTY_FIELDS_BY_CODE.gastroenterology),
  row('ent', 'ORL (Oto-rhino-laryngologie)', "Médecine de l'oreille, nez et gorge", 'ear', SPECIALTY_FIELDS_BY_CODE.ent),
  row('pneumology', 'Pneumologie', 'Médecine des poumons et voies respiratoires', 'lungs', PNEUMOLOGY_FIELDS),
  row('rheumatology', 'Rhumatologie', 'Médecine des rhumatismes et maladies articulaires', 'joints', SPECIALTY_FIELDS_BY_CODE.rheumatology),
  row('endocrinology', 'Endocrinologie', 'Médecine des hormones et glandes endocrines', 'hormones', BASIC_SPECIALTY_FIELDS),
  row('oncology', 'Oncologie', 'Médecine du cancer', 'cancer', SPECIALTY_FIELDS_BY_CODE.oncology),
  row('surgery', 'Chirurgie Générale', 'Chirurgie générale', 'surgery', SPECIALTY_FIELDS_BY_CODE.surgery),
  row(
    'pediatric-ophthalmology',
    'Ophtalmologie pédiatrique',
    'Ophtalmologie de l’enfant',
    'eye-child',
    SPECIALTY_FIELDS_BY_CODE['pediatric-ophthalmology'],
  ),
  row('nephrology', 'Néphrologie', 'Médecine du rein', 'kidney', BASIC_SPECIALTY_FIELDS),
  row('hematology', 'Hématologie', 'Médecine du sang', 'blood', BASIC_SPECIALTY_FIELDS),
];

export function specialtyCreateInputFromSeed(r: SeedRow): Prisma.SpecialtyCreateInput {
  return {
    code: r.code,
    name: r.name,
    description: r.description,
    icon: r.icon,
    specificFields: r.specificFields as Prisma.InputJsonValue,
    examTypes: r.examTypes,
  } as Prisma.SpecialtyCreateInput;
}
