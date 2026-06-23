'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format, parseISO, subMonths } from 'date-fns';
import type { VitalTimelinePoint } from '@/types/patient';

export type VitalPoint = VitalTimelinePoint;

const METRICS: { key: string; label: string; unit: string; low?: number; high?: number }[] = [
  { key: 'taSys', label: 'TA sys', unit: 'mmHg', low: 90, high: 140 },
  { key: 'taDia', label: 'TA dia', unit: 'mmHg', low: 60, high: 90 },
  { key: 'fc', label: 'FC', unit: 'bpm', low: 50, high: 100 },
  { key: 'poids', label: 'Poids', unit: 'kg' },
  { key: 'spo2', label: 'SpO₂', unit: '%', low: 95, high: 100 },
  { key: 'glycemie', label: 'Glycémie', unit: 'g/L', low: 0.7, high: 1.1 },
];

function parseNum(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isOutOfRange(value: number, low?: number, high?: number): boolean {
  if (low != null && value < low) return true;
  if (high != null && value > high) return true;
  return false;
}

function formatDisplay(v: unknown, unit?: string) {
  const n = parseNum(v);
  if (n == null) return '—';
  return unit ? `${n} ${unit}` : String(n);
}

export type VitalSignsTimelineProps = {
  points: VitalPoint[];
  className?: string;
};

export function VitalSignsTimeline({ points, className }: VitalSignsTimelineProps) {
  const [from, setFrom] = useState(() => format(subMonths(new Date(), 12), 'yyyy-MM-dd'));
  const [to, setTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const filtered = useMemo(() => {
    const a = parseISO(from + 'T00:00:00.000Z').getTime();
    const b = parseISO(to + 'T23:59:59.999Z').getTime();
    return points.filter((p) => {
      const t = parseISO(p.date).getTime();
      return t >= a && t <= b;
    });
  }, [points, from, to]);

  const chartData = useMemo(() => {
    return filtered.map((p) => {
      const row: Record<string, string | number | null> = {
        t: p.date,
        label: format(parseISO(p.date), 'dd/MM/yy'),
      };
      for (const m of METRICS) {
        row[m.key] = parseNum(p.values[m.key]);
      }
      return row;
    });
  }, [filtered]);

  const activeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of chartData) {
      for (const m of METRICS) {
        if (row[m.key] != null && typeof row[m.key] === 'number') keys.add(m.key);
      }
    }
    return METRICS.filter((m) => keys.has(m.key));
  }, [chartData]);

  const latestAlerts = useMemo(() => {
    if (filtered.length === 0) return [];
    const last = filtered[filtered.length - 1];
    const alerts: { label: string; value: string; level: 'warn' | 'ok' }[] = [];
    for (const m of METRICS) {
      if (m.low == null && m.high == null) continue;
      const n = parseNum(last.values[m.key]);
      if (n == null) continue;
      const bad = isOutOfRange(n, m.low, m.high);
      alerts.push({
        label: m.label,
        value: formatDisplay(n, m.unit),
        level: bad ? 'warn' : 'ok',
      });
    }
    return alerts;
  }, [filtered]);

  const primary = activeKeys[0];
  const yDomain = useMemo(() => {
    if (!primary) return undefined;
    const vals = chartData.map((r) => r[primary.key]).filter((v): v is number => typeof v === 'number');
    if (vals.length === 0) return undefined;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.15 || 5;
    return [Math.floor(min - pad), Math.ceil(max + pad)] as [number, number];
  }, [chartData, primary]);

  const colors = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0891b2', '#be123c'];

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">Constantes dans le temps</CardTitle>
        <div className="flex flex-wrap items-end gap-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="vf">Du</Label>
            <Input id="vf" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vt">Au</Label>
            <Input id="vt" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {latestAlerts.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {latestAlerts.map((a) => (
              <li
                key={a.label}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs font-medium',
                  a.level === 'warn'
                    ? 'border-red-300 bg-red-50 text-red-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                )}
              >
                {a.label} : {a.value}
              </li>
            ))}
          </ul>
        ) : null}
      </CardHeader>
      <CardContent className="h-[360px]">
        {activeKeys.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune mesure numérique sur la période.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              {primary && primary.low != null && primary.high != null && yDomain ? (
                <ReferenceArea
                  y1={primary.low}
                  y2={primary.high}
                  fill="#22c55e"
                  fillOpacity={0.12}
                  strokeOpacity={0}
                />
              ) : null}
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={36} domain={yDomain} />
              <Tooltip
                formatter={(value, name) => {
                  const m = METRICS.find((x) => x.key === name);
                  const n = typeof value === 'number' ? value : Number(value);
                  const label = `${Number.isFinite(n) ? n.toFixed(1) : '—'} ${m?.unit ?? ''}`;
                  const bad =
                    m && Number.isFinite(n) && isOutOfRange(n, m.low, m.high) ? ' ⚠ hors plage' : '';
                  return [label + bad, m?.label ?? String(name)];
                }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.t
                    ? format(parseISO(String(payload[0].payload.t)), 'PPpp')
                    : ''
                }
              />
              <Legend />
              {activeKeys.map((m, i) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={colors[i % colors.length]}
                  dot={(props) => {
                    const { cx, cy, payload } = props as {
                      cx?: number;
                      cy?: number;
                      payload?: Record<string, number | null>;
                    };
                    const v = payload?.[m.key];
                    if (cx == null || cy == null || v == null) return null;
                    const bad = isOutOfRange(v, m.low, m.high);
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={bad ? '#dc2626' : colors[i % colors.length]}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
