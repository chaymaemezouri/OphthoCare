/**
 * Aligne `Consultation.structuredData` (clés template) avec le format notes cliniques legacy.
 */
export function consultationToClinicalStructured(
  specialtyCode: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (specialtyCode === 'ophthalmology' || specialtyCode === 'pediatric-ophthalmology') {
    return {
      visualAcuity: {
        od: String(data.acuiteOD ?? ''),
        og: String(data.acuiteOG ?? ''),
        method: String(data.acuiteMethod ?? ''),
      },
      intraocularPressure: {
        od: data.pioOD ?? data.pio ?? null,
        og: data.pioOG ?? data.pio ?? null,
        time: String(data.pioTime ?? ''),
      },
      refraction: {
        od: String(data.refractionOD ?? data.refraction ?? ''),
        og: String(data.refractionOG ?? data.refraction ?? ''),
      },
      anteriorSegment: { notes: String(data.segmentAnt ?? '') },
      fundus: { notes: String(data.fondOeil ?? '') },
      extensions: Object.fromEntries(
        Object.entries(data).filter(
          ([k]) =>
            ![
              'acuiteOD',
              'acuiteOG',
              'pio',
              'pioOD',
              'pioOG',
              'refraction',
              'refractionOD',
              'refractionOG',
              'segmentAnt',
              'fondOeil',
            ].includes(k),
        ),
      ),
    };
  }
  return { ...data };
}
