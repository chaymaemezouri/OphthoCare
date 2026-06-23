'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getWhoCurveTable,
  interpPercentile,
  interpretPercentile,
  metricLabel,
  metricUnit,
  type GrowthMetric,
  type GrowthSex,
  type PercentileKey,
} from '@/lib/medical/who-growth-data';

const PERCENTILE_LINES: { key: PercentileKey; name: string; stroke: string; width?: number }[] = [
  { key: 'p3', name: 'P3', stroke: '#cbd5e1' },
  { key: 'p10', name: 'P10', stroke: '#94a3b8' },
  { key: 'p25', name: 'P25', stroke: '#64748b' },
  { key: 'p50', name: 'P50', stroke: '#22c55e', width: 2 },
  { key: 'p75', name: 'P75', stroke: '#64748b' },
  { key: 'p90', name: 'P90', stroke: '#94a3b8' },
  { key: 'p97', name: 'P97', stroke: '#cbd5e1' },
];

export type GrowthCurveChartProps = {
  sex: GrowthSex;
  ageMonths: number;
  weightKg?: number;
  heightCm?: number;
  headCm?: number;
  className?: string;
};

export function GrowthCurveChart({
  sex: initialSex,
  ageMonths,
  weightKg,
  heightCm,
  headCm,
  className,
}: GrowthCurveChartProps) {
  const [sex, setSex] = useState<GrowthSex>(initialSex);
  const [metric, setMetric] = useState<GrowthMetric>(() => {
    if (weightKg != null && weightKg > 0) return 'weight';
    if (heightCm != null && heightCm > 0) return 'length';
    if (headCm != null && headCm > 0) return 'head';
    return 'weight';
  });

  const patientValue = useMemo(() => {
    if (metric === 'weight') return weightKg;
    if (metric === 'length') return heightCm;
    return headCm;
  }, [metric, weightKg, heightCm, headCm]);

  const table = useMemo(() => getWhoCurveTable(metric, sex), [metric, sex]);

  const chartRows = useMemo(() => {
    const rows: Record<string, number>[] = [];
    for (let a = 0; a <= 24; a += 0.5) {
      const row: Record<string, number> = { ageM: Math.round(a * 10) / 10 };
      for (const p of PERCENTILE_LINES) {
        row[p.key] = Math.round(interpPercentile(a, p.key, table) * 100) / 100;
      }
      rows.push(row);
    }
    return rows;
  }, [table]);

  const interpMsg = useMemo(() => {
    if (patientValue == null || !Number.isFinite(patientValue) || patientValue <= 0) {
      return `Saisissez ${metricLabel(metric).toLowerCase()} dans le formulaire pour positionner le patient sur la courbe.`;
    }
    return interpretPercentile(ageMonths, patientValue, metric, sex);
  }, [patientValue, ageMonths, metric, sex]);

  const unit = metricUnit(metric);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">Courbes de croissance (OMS, 0–24 mois)</CardTitle>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label>Sexe référence</Label>
            <Select value={sex} onValueChange={(v) => setSex((v as GrowthSex) ?? 'male')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Garçon</SelectItem>
                <SelectItem value="female">Fille</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Mesure</Label>
            <Select value={metric} onValueChange={(v) => setMetric((v as GrowthMetric) ?? 'weight')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">Poids</SelectItem>
                <SelectItem value="length">Taille</SelectItem>
                <SelectItem value="head">Périmètre crânien</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">{interpMsg}</p>
      </CardHeader>
      <CardContent className="h-[340px]">
        {patientValue != null && patientValue > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="ageM"
                tick={{ fontSize: 11 }}
                label={{ value: 'Âge (mois)', position: 'insideBottom', offset: -4 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: unit, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value) => {
                  const n = typeof value === 'number' ? value : Number(value);
                  return [`${Number.isFinite(n) ? n.toFixed(2) : '—'} ${unit}`, ''];
                }}
              />
              <Legend />
              {PERCENTILE_LINES.map((p) => (
                <Line
                  key={p.key}
                  type="monotone"
                  dataKey={p.key}
                  stroke={p.stroke}
                  strokeWidth={p.width ?? 1}
                  dot={false}
                  name={p.name}
                />
              ))}
              <ReferenceDot
                x={ageMonths}
                y={patientValue}
                r={7}
                fill="#2563eb"
                stroke="#1e3a8a"
                name="Patient"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground flex h-full items-center justify-center">
            Aucune valeur {metricLabel(metric).toLowerCase()} pour tracer le point patient.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
