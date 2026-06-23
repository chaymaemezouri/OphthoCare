import { describe, expect, it } from 'vitest';
import { buildSpecialtyZodSchema } from './build-specialty-zod';
import type { SpecialtyField } from './specialty-field.types';

const fields: SpecialtyField[] = [
  { key: 'poids', label: 'Poids', type: 'number', unit: 'kg', required: true },
  { key: 'taille', label: 'Taille', type: 'number', unit: 'cm' },
  { key: 'allergies', label: 'Allergies', type: 'multiselect', options: ['A', 'B'] },
];

describe('buildSpecialtyZodSchema', () => {
  it('valide les champs requis et coerce les nombres', () => {
    const schema = buildSpecialtyZodSchema(fields);
    const ok = schema.safeParse({ poids: '72', taille: 175, allergies: ['A'] });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.poids).toBe(72);
    }
  });

  it('rejette un poids manquant si required', () => {
    const schema = buildSpecialtyZodSchema(fields);
    const bad = schema.safeParse({ taille: 180 });
    expect(bad.success).toBe(false);
  });
});
