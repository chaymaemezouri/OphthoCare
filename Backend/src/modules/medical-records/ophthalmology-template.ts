/**
 * Schéma de champs par défaut ophtalmologie — fusionné avec Specialty.defaultFields en base pour d’autres spécialités.
 */
export const OPHTHALMOLOGY_FIELD_TEMPLATE = {
  specialtyKey: 'ophthalmology',
  label: 'Ophtalmologie',
  sections: [
    {
      id: 'visualAcuity',
      label: 'Acuité visuelle',
      fields: [
        { id: 'od', label: 'OD', type: 'string', placeholder: 'ex. 10/10 P4' },
        { id: 'og', label: 'OG', type: 'string', placeholder: 'ex. 10/10 P4' },
        { id: 'method', label: 'Méthode', type: 'string', placeholder: 'Snellen, Parinaud…' },
      ],
    },
    {
      id: 'intraocularPressure',
      label: 'Pression intra-oculaire (mmHg)',
      fields: [
        { id: 'od', label: 'PIO OD', type: 'number' },
        { id: 'og', label: 'PIO OG', type: 'number' },
        { id: 'time', label: 'Heure / contexte', type: 'string' },
      ],
    },
    {
      id: 'refraction',
      label: 'Réfraction',
      fields: [
        { id: 'od', label: 'OD', type: 'string', placeholder: 'sph / cyl / axe' },
        { id: 'og', label: 'OG', type: 'string' },
      ],
    },
    {
      id: 'anteriorSegment',
      label: 'Segment antérieur',
      fields: [{ id: 'notes', label: 'Examen', type: 'text' }],
    },
    {
      id: 'fundus',
      label: 'Fond d’œil',
      fields: [{ id: 'notes', label: 'Examen', type: 'text' }],
    },
  ],
  /** Valeurs initiales suggérées pour structuredData côté UI */
  exampleStructuredData: {
    visualAcuity: { od: '', og: '', method: '' },
    intraocularPressure: { od: null, og: null, time: '' },
    refraction: { od: '', og: '' },
    anteriorSegment: { notes: '' },
    fundus: { notes: '' },
    extensions: {} as Record<string, unknown>,
  },
};

export const GENERIC_SPECIALTY_TEMPLATE = {
  specialtyKey: 'generic',
  label: 'Consultation',
  sections: [
    {
      id: 'vitals',
      label: 'Constantes / synthèse',
      fields: [
        { id: 'bp', label: 'TA', type: 'string' },
        { id: 'hr', label: 'FC', type: 'string' },
        { id: 'weight', label: 'Poids', type: 'string' },
      ],
    },
    {
      id: 'clinical',
      label: 'Examen clinique',
      fields: [{ id: 'notes', label: 'Notes structurées', type: 'text' }],
    },
  ],
  exampleStructuredData: {
    vitals: { bp: '', hr: '', weight: '' },
    clinical: { notes: '' },
    extensions: {} as Record<string, unknown>,
  },
};
