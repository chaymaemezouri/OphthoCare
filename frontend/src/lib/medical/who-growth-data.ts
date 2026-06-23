/** Courbes OMS simplifiées 0–24 mois (percentiles clés) — usage pédagogique. */

export type GrowthMetric = 'weight' | 'length' | 'head';
export type GrowthSex = 'male' | 'female';

export type PercentileKey = 'p3' | 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | 'p97';

export type GrowthPoint = {
  ageM: number;
  p3: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p97: number;
};

const WEIGHT_MALE: GrowthPoint[] = [
  { ageM: 0, p3: 2.5, p10: 2.9, p25: 3.2, p50: 3.5, p75: 3.8, p90: 4.1, p97: 4.4 },
  { ageM: 3, p3: 4.4, p10: 5.0, p25: 5.5, p50: 6.0, p75: 6.5, p90: 7.1, p97: 7.7 },
  { ageM: 6, p3: 5.8, p10: 6.4, p25: 7.0, p50: 7.7, p75: 8.4, p90: 9.1, p97: 9.8 },
  { ageM: 9, p3: 6.9, p10: 7.6, p25: 8.2, p50: 8.9, p75: 9.7, p90: 10.5, p97: 11.4 },
  { ageM: 12, p3: 7.8, p10: 8.6, p25: 9.4, p50: 10.1, p75: 11.0, p90: 12.0, p97: 12.9 },
  { ageM: 18, p3: 8.9, p10: 9.8, p25: 10.6, p50: 11.5, p75: 12.5, p90: 13.6, p97: 14.8 },
  { ageM: 24, p3: 9.7, p10: 10.7, p25: 11.6, p50: 12.5, p75: 13.6, p90: 14.9, p97: 16.3 },
];

const WEIGHT_FEMALE: GrowthPoint[] = [
  { ageM: 0, p3: 2.4, p10: 2.7, p25: 3.0, p50: 3.3, p75: 3.6, p90: 3.9, p97: 4.2 },
  { ageM: 3, p3: 4.0, p10: 4.5, p25: 5.0, p50: 5.5, p75: 6.0, p90: 6.5, p97: 7.0 },
  { ageM: 6, p3: 5.3, p10: 5.9, p25: 6.4, p50: 7.1, p75: 7.8, p90: 8.5, p97: 9.2 },
  { ageM: 9, p3: 6.3, p10: 7.0, p25: 7.6, p50: 8.3, p75: 9.1, p90: 9.9, p97: 10.7 },
  { ageM: 12, p3: 7.2, p10: 7.9, p25: 8.6, p50: 9.4, p75: 10.3, p90: 11.2, p97: 12.1 },
  { ageM: 18, p3: 8.2, p10: 9.0, p25: 9.8, p50: 10.7, p75: 11.7, p90: 12.7, p97: 13.7 },
  { ageM: 24, p3: 9.0, p10: 9.8, p25: 10.7, p50: 11.6, p75: 12.6, p90: 13.7, p97: 14.9 },
];

/** Longueur (cm) */
const LENGTH_MALE: GrowthPoint[] = [
  { ageM: 0, p3: 46, p10: 47.5, p25: 49, p50: 50.5, p75: 52, p90: 53.5, p97: 55 },
  { ageM: 3, p3: 57, p10: 58.5, p25: 60, p50: 61.5, p75: 63, p90: 64.5, p97: 66 },
  { ageM: 6, p3: 63, p10: 64.5, p25: 66, p50: 67.5, p75: 69, p90: 70.5, p97: 72 },
  { ageM: 12, p3: 70, p10: 71.5, p25: 73, p50: 74.5, p75: 76, p90: 77.5, p97: 79 },
  { ageM: 18, p3: 76, p10: 77.5, p25: 79, p50: 80.5, p75: 82, p90: 83.5, p97: 85 },
  { ageM: 24, p3: 81, p10: 82.5, p25: 84, p50: 85.5, p75: 87, p90: 88.5, p97: 90 },
];

const LENGTH_FEMALE: GrowthPoint[] = [
  { ageM: 0, p3: 45, p10: 46.5, p25: 48, p50: 49.5, p75: 51, p90: 52.5, p97: 54 },
  { ageM: 3, p3: 55, p10: 56.5, p25: 58, p50: 59.5, p75: 61, p90: 62.5, p97: 64 },
  { ageM: 6, p3: 61, p10: 62.5, p25: 64, p50: 65.5, p75: 67, p90: 68.5, p97: 70 },
  { ageM: 12, p3: 68, p10: 69.5, p25: 71, p50: 72.5, p75: 74, p90: 75.5, p97: 77 },
  { ageM: 18, p3: 74, p10: 75.5, p25: 77, p50: 78.5, p75: 80, p90: 81.5, p97: 83 },
  { ageM: 24, p3: 79, p10: 80.5, p25: 82, p50: 83.5, p75: 85, p90: 86.5, p97: 88 },
];

/** Périmètre crânien (cm) */
const HEAD_MALE: GrowthPoint[] = [
  { ageM: 0, p3: 32, p10: 33, p25: 34, p50: 35, p75: 36, p90: 37, p97: 38 },
  { ageM: 3, p3: 38, p10: 39, p25: 40, p50: 41, p75: 42, p90: 43, p97: 44 },
  { ageM: 6, p3: 41, p10: 42, p25: 43, p50: 44, p75: 45, p90: 46, p97: 47 },
  { ageM: 12, p3: 44, p10: 45, p25: 46, p50: 47, p75: 48, p90: 49, p97: 50 },
  { ageM: 18, p3: 45, p10: 46, p25: 47, p50: 48, p75: 49, p90: 50, p97: 51 },
  { ageM: 24, p3: 46, p10: 47, p25: 48, p50: 49, p75: 50, p90: 51, p97: 52 },
];

const HEAD_FEMALE: GrowthPoint[] = [
  { ageM: 0, p3: 31, p10: 32, p25: 33, p50: 34, p75: 35, p90: 36, p97: 37 },
  { ageM: 3, p3: 37, p10: 38, p25: 39, p50: 40, p75: 41, p90: 42, p97: 43 },
  { ageM: 6, p3: 40, p10: 41, p25: 42, p50: 43, p75: 44, p90: 45, p97: 46 },
  { ageM: 12, p3: 43, p10: 44, p25: 45, p50: 46, p75: 47, p90: 48, p97: 49 },
  { ageM: 18, p3: 44, p10: 45, p25: 46, p50: 47, p75: 48, p90: 49, p97: 50 },
  { ageM: 24, p3: 45, p10: 46, p25: 47, p50: 48, p75: 49, p90: 50, p97: 51 },
];

export function getWhoCurveTable(metric: GrowthMetric, sex: GrowthSex): GrowthPoint[] {
  if (metric === 'weight') return sex === 'male' ? WEIGHT_MALE : WEIGHT_FEMALE;
  if (metric === 'length') return sex === 'male' ? LENGTH_MALE : LENGTH_FEMALE;
  return sex === 'male' ? HEAD_MALE : HEAD_FEMALE;
}

export function interpPercentile(
  ageM: number,
  key: PercentileKey,
  table: GrowthPoint[],
): number {
  if (ageM <= table[0].ageM) return table[0][key];
  if (ageM >= table[table.length - 1].ageM) return table[table.length - 1][key];
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i];
    const b = table[i + 1];
    if (ageM >= a.ageM && ageM <= b.ageM) {
      const t = (ageM - a.ageM) / (b.ageM - a.ageM);
      return a[key] + t * (b[key] - a[key]);
    }
  }
  return table[0][key];
}

export function metricUnit(metric: GrowthMetric): string {
  return metric === 'weight' ? 'kg' : 'cm';
}

export function metricLabel(metric: GrowthMetric): string {
  switch (metric) {
    case 'weight':
      return 'Poids';
    case 'length':
      return 'Taille';
    default:
      return 'Périmètre crânien';
  }
}

export function interpretPercentile(ageM: number, value: number, metric: GrowthMetric, sex: GrowthSex): string {
  const table = getWhoCurveTable(metric, sex);
  const p50 = interpPercentile(ageM, 'p50', table);
  const p3 = interpPercentile(ageM, 'p3', table);
  const p97 = interpPercentile(ageM, 'p97', table);
  const unit = metricUnit(metric);
  if (value < p3) return `${value} ${unit} — sous le 3e percentile`;
  if (value < p50) return `${value} ${unit} — entre le 3e et le 50e percentile`;
  if (value < p97) return `${value} ${unit} — entre le 50e et le 97e percentile`;
  return `${value} ${unit} — au-dessus du 97e percentile`;
}
